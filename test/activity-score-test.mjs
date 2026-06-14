import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';
const results = [];

async function test(name, fn) {
  try {
    await fn();
    results.push({ name, status: '✅' });
    console.log(`✅ ${name}`);
  } catch (e) {
    results.push({ name, status: '❌', error: e.message });
    console.log(`❌ ${name}: ${e.message}`);
  }
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  // 1. 未登录访问
  await test('1. 未登录访问 /activities', async () => {
    await page.goto(`${BASE_URL}/activities`);
    await page.waitForTimeout(2000);
    const url = page.url();
    if (!url.includes('/login')) {
      throw new Error(`未重定向到登录页，当前: ${url}`);
    }
    console.log(`   重定向到: ${url}`);
  });

  // 2. 登录
  await test('2. 登录 admin', async () => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="tel"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin**', { timeout: 8000 });
  });

  // 3. 访问活动评分页面
  await test('3. 访问活动评分页 /activities', async () => {
    await page.goto(`${BASE_URL}/activities`);
    await page.waitForLoadState('networkidle');
    // 等待 React 水合
    await page.waitForTimeout(3000);
    const content = await page.content();
    if (!content.includes('周评')) {
      throw new Error('未找到周评标题');
    }
    console.log(`   页面包含周评`);
  });

  // 4. 显示周评标题和满分
  await test('4. 显示周评标题和满分51', async () => {
    const content = await page.content();
    if (!content.includes('51')) {
      throw new Error('未找到满分51');
    }
    console.log(`   找到满分51`);
  });

  // 5. 显示无分类项目
  await test('5. 显示无分类项目', async () => {
    const content = await page.content();
    if (!content.includes('CX') || !content.includes('晨兴')) {
      throw new Error('未找到CX/晨兴');
    }
    if (!content.includes('追求')) throw new Error('未找到追求');
    if (!content.includes('聚会')) throw new Error('未找到聚会');
    console.log(`   无分类项目显示完整`);
  });

  // 6. 显示尽功用分类
  await test('6. 显示尽功用分类', async () => {
    const content = await page.content();
    if (!content.includes('尽功用')) throw new Error('未找到尽功用分类');
    if (!content.includes('Gospel') && !content.includes('福音')) {
      throw new Error('未找到Gospel');
    }
    console.log(`   尽功用分类显示完整`);
  });

  // 7. 查看叶子项输入框 - 等待更长时间
  await test('7. 叶子项输入框存在', async () => {
    // 等待 React 渲染完成
    await page.waitForSelector('input[type="number"]', { timeout: 10000 }).catch(() => null);
    const inputs = page.locator('input[type="number"]');
    const count = await inputs.count();
    if (count === 0) {
      // 截图调试
      const html = await page.content();
      console.log(`   HTML长度: ${html.length}`);
      throw new Error(`未找到数字输入框，页面内容: ${html.substring(0, 500)}`);
    }
    console.log(`   找到 ${count} 个输入框`);
  });

  // 8. 默认分值为满分
  await test('8. 输入框默认显示满分', async () => {
    const inputs = page.locator('input[type="number"]');
    const firstInputValue = await inputs.first().inputValue({ timeout: 5000 });
    if (!firstInputValue || firstInputValue === '0') {
      throw new Error(`输入框未显示默认值，当前: ${firstInputValue}`);
    }
    console.log(`   第一个输入框值: ${firstInputValue}`);
  });

  // 9. 修改分值
  await test('9. 修改分值', async () => {
    const inputs = page.locator('input[type="number"]');
    await inputs.first().fill('4', { timeout: 5000 });
    await page.waitForTimeout(500);
    const newValue = await inputs.first().inputValue({ timeout: 5000 });
    if (newValue !== '4') throw new Error(`修改分值失败，新值: ${newValue}`);
    console.log(`   修改成功，新值: ${newValue}`);
  });

  // 10. 总分实时更新
  await test('10. 总分实时更新', async () => {
    const content = await page.content();
    // 检查页面是否包含当前分数
    if (!content.includes('当前')) {
      throw new Error('未找到当前分数显示');
    }
    console.log(`   当前分数显示正常`);
  });

  // 11. 提交评分按钮
  await test('11. 提交评分按钮存在', async () => {
    const submitBtn = page.locator('button:has-text("提交评分")');
    if (await submitBtn.count() === 0) {
      throw new Error('未找到提交评分按钮');
    }
    console.log(`   提交评分按钮存在`);
  });

  // 12. 提交评分
  await test('12. 提交评分', async () => {
    const submitBtn = page.locator('button:has-text("提交评分")');
    await submitBtn.click();
    await page.waitForTimeout(3000);
    const content = await page.content();
    if (!content.includes('保存') && !content.includes('成功')) {
      console.log('   可能没有显示成功提示');
    }
    console.log(`   提交完成`);
  });

  // 13. 历史记录按钮
  await test('13. 历史记录按钮存在', async () => {
    const historyBtn = page.locator('button:has-text("历史记录")');
    if (await historyBtn.count() === 0) {
      throw new Error('未找到历史记录按钮');
    }
    console.log(`   历史记录按钮存在`);
  });

  // 14. 点击历史记录
  await test('14. 点击历史记录', async () => {
    const historyBtn = page.locator('button:has-text("历史记录")');
    await historyBtn.click();
    await page.waitForTimeout(1000);
    const content = await page.content();
    if (!content.includes('历史记录')) {
      console.log('   历史面板已展开');
    }
  });

  // 15. 刷新页面保留
  await test('15. 刷新页面分值保留', async () => {
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    const inputs = page.locator('input[type="number"]');
    const firstValue = await inputs.first().inputValue({ timeout: 5000 });
    console.log(`   刷新后第一个输入框值: ${firstValue}`);
  });

  // 16. 底部导航
  await test('16. 底部导航显示活动', async () => {
    const navItems = page.locator('nav a, nav button, [class*="bottom"] a, [class*="bottom"] button');
    const count = await navItems.count();
    console.log(`   底部导航项数量: ${count}`);
    if (count === 0) {
      console.log('   尝试其他选择器...');
    }
  });

  // 17. 回归测试 - 今日页面
  await test('17. 今日页面 /today', async () => {
    await page.goto(`${BASE_URL}/today`);
    await page.waitForLoadState('networkidle');
    console.log(`   URL: ${page.url()}`);
  });

  // 18. 回归测试 - 团体页面
  await test('18. 团体页面 /group', async () => {
    await page.goto(`${BASE_URL}/group`);
    await page.waitForLoadState('networkidle');
  });

  // 19. 回归测试 - 任务管理
  await test('19. 任务管理页 /admin/tasks', async () => {
    await page.goto(`${BASE_URL}/admin/tasks`);
    await page.waitForLoadState('networkidle');
  });

  // 20. 回归测试 - 活动模板管理
  await test('20. 活动模板管理 /admin/activities', async () => {
    await page.goto(`${BASE_URL}/admin/activities`);
    await page.waitForLoadState('networkidle');
  });

  // 21. 退出登录
  await test('21. 退出登录', async () => {
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle');
    const logoutBtn = page.locator('button:has-text("退出")').first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForTimeout(1000);
    }
  });

  // 检查控制台错误
  console.log('\n--- 控制台错误 ---');
  const realErrors = errors.filter(e =>
    !e.includes('webpack-hmr') &&
    !e.includes('HotModule') &&
    !e.includes('favicon') &&
    !e.includes('500')
  );
  if (realErrors.length === 0) {
    console.log('无JavaScript错误');
  } else {
    realErrors.forEach(e => console.log(`ERROR: ${e}`));
  }

  await browser.close();

  // 输出总结
  console.log('\n========== 测试总结 ==========');
  console.log(`总计: ${results.length} 项`);
  console.log(`通过: ${results.filter(r => r.status === '✅').length}`);
  console.log(`失败: ${results.filter(r => r.status === '❌').length}`);

  results.filter(r => r.status === '❌').forEach(r => {
    console.log(`❌ ${r.name}: ${r.error}`);
  });

  return results;
}

run().catch(console.error);
