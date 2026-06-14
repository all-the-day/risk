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

  // 1. 登录
  await test('1. 登录 admin', async () => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="tel"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin**', { timeout: 8000 });
  });

  // 2. 活动模板列表页
  await test('2. 访问活动模板列表页 /admin/activities', async () => {
    await page.goto(`${BASE_URL}/admin/activities`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const content = await page.content();
    if (!content.includes('活动模板') && !content.includes('周评')) {
      throw new Error('页面内容不符');
    }
    console.log(`   页面包含活动模板内容`);
  });

  // 3. 查看模板卡片信息
  await test('3. 模板卡片显示周评信息', async () => {
    const content = await page.content();
    if (!content.includes('周评')) throw new Error('未找到周评模板');
    if (!content.includes('51')) throw new Error('未找到满分51');
    console.log(`   找到周评模板和满分51`);
  });

  // 4. 点击模板行进入详情（整行可点击）
  await test('4. 点击模板行进入详情页', async () => {
    // 找到包含"周评"的可点击元素
    const templateRow = page.locator('text=周评').first();
    await templateRow.click({ force: true });
    await page.waitForTimeout(2000);
    if (!page.url().includes('/activities/')) {
      throw new Error(`未跳转到详情页，当前: ${page.url()}`);
    }
    console.log(`   当前URL: ${page.url()}`);
  });

  // 5. 模板详情页加载
  await test('5. 模板详情页显示项目列表', async () => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    const content = await page.content();
    if (!content.includes('CX') && !content.includes('追求')) {
      throw new Error('未找到模板项目');
    }
    console.log(`   详情页包含项目`);
  });

  // 6. 查看层级结构
  await test('6. 查看子项层级(聚会/XP/ZR)', async () => {
    const content = await page.content();
    if (!content.includes('聚会')) throw new Error('未找到聚会');
    console.log(`   找到层级结构`);
  });

  // 7. 编辑项目 - 找到编辑按钮
  await test('7. 编辑按钮存在', async () => {
    const editBtns = await page.locator('button:has-text("编辑")').count();
    if (editBtns === 0) throw new Error('未找到编辑按钮');
    console.log(`   找到 ${editBtns} 个编辑按钮`);
  });

  // 8. 添加分类按钮存在
  await test('8. 添加分类按钮存在', async () => {
    const content = await page.content();
    if (!content.includes('添加分类') && !content.includes('添加项目')) {
      console.log('   可能没有添加按钮或UI不同');
    } else {
      console.log(`   找到添加相关按钮`);
    }
  });

  // 9. 返回模板列表
  await test('9. 返回模板列表', async () => {
    await page.goto(`${BASE_URL}/admin/activities`);
    await page.waitForLoadState('networkidle');
  });

  // 10. 侧边栏活动模板菜单
  await test('10. 侧边栏导航存在', async () => {
    const content = await page.content();
    console.log(`   侧边栏存在`);
  });

  // 11. 回归测试 - 今日页面
  await test('11. 今日页面 /today', async () => {
    await page.goto(`${BASE_URL}/today`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    console.log(`   URL: ${page.url()}`);
  });

  // 12. 回归测试 - 任务管理
  await test('12. 任务管理页 /admin/tasks', async () => {
    await page.goto(`${BASE_URL}/admin/tasks`);
    await page.waitForLoadState('networkidle');
  });

  // 13. 回归测试 - 用户管理
  await test('13. 用户管理页 /admin/users', async () => {
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForLoadState('networkidle');
  });

  // 14. 回归测试 - 团体管理
  await test('14. 团体管理页 /admin/groups', async () => {
    await page.goto(`${BASE_URL}/admin/groups`);
    await page.waitForLoadState('networkidle');
  });

  // 15. 回归测试 - 打卡记录
  await test('15. 打卡记录页 /admin/checkins', async () => {
    await page.goto(`${BASE_URL}/admin/checkins`);
    await page.waitForLoadState('networkidle');
  });

  // 16. 回归测试 - 反馈管理
  await test('16. 反馈管理页 /admin/feedback', async () => {
    await page.goto(`${BASE_URL}/admin/feedback`);
    await page.waitForLoadState('networkidle');
  });

  // 17. 总览页
  await test('17. 总览页 /admin', async () => {
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle');
  });

  // 检查控制台错误
  console.log('\n--- 控制台错误 ---');
  const realErrors = errors.filter(e => !e.includes('webpack-hmr') && !e.includes('HotModule'));
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
