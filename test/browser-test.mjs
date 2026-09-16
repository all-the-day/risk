/**
 * 端到端冒烟测试：登录 → 今日打卡 → 报告页周表 → 后台周分录入
 * 前置：已运行 npm run db:seed 与 npm run db:seed:demo；dev server 跑在 3000 端口
 *   node test/browser-test.mjs
 */
import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';
const MEMBER = { nickname: '潘SY', password: '123456' };
const ADMIN = { nickname: 'admin', password: 'admin123' };
const LEAF_COUNT = 9; // 周评模板的叶子项数量（可打卡、可计分）

const results = [];

async function test(name, fn) {
  try {
    await fn();
    results.push({ name, status: 'ok' });
    console.log(`✅ ${name}`);
  } catch (e) {
    results.push({ name, status: 'fail', error: e.message });
    console.log(`❌ ${name}: ${e.message}`);
  }
}

async function login(page, { nickname, password }) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input#nickname', nickname);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
}

const checkButtons = (page) =>
  page.locator('button[aria-label="打卡"], button[aria-label="取消打卡"]');

async function run() {
  const browser = await chromium.launch();
  const errors = [];

  // ---------- 成员端 ----------
  const memberContext = await browser.newContext({ viewport: { width: 420, height: 900 } });
  const page = await memberContext.newPage();
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (e) => errors.push(`JS 异常: ${e}`));

  await test('1. 成员登录', async () => {
    await login(page, MEMBER);
    if (!page.url().includes('/today')) throw new Error(`登录后应到 /today，实际 ${page.url()}`);
  });

  await test('2. 今日页显示 CL 事项与分组', async () => {
    const body = await page.textContent('body');
    for (const token of ['晨兴', '追求', '团体祷告', '聚会', '尽功用']) {
      if (!body.includes(token)) throw new Error(`未找到「${token}」`);
    }
  });

  await test('3. 打卡按钮数量 = 叶子项数量（父项与分类标题不可点）', async () => {
    const count = await checkButtons(page).count();
    if (count !== LEAF_COUNT) {
      throw new Error(`打卡按钮 ${count} 个，应为 ${LEAF_COUNT}（多出说明父项被渲染成可点了）`);
    }
    console.log(`   可打卡 ${count} 项，与叶子项一致`);
  });

  let toggledItemId = null;

  // 等某项的按钮变成期望状态（避免用固定 sleep 猜编译/网络耗时）
  async function waitLabel(itemId, label) {
    await page.waitForFunction(
      ([id, want]) => {
        const el = document.querySelector(`button[data-item-id="${id}"]`);
        return el?.getAttribute('aria-label') === want;
      },
      [itemId, label],
      { timeout: 20000 }
    );
  }

  // 打卡 + 取消合并成一项：无论中间哪步失败，finally 都要把状态还原，
  // 否则会在演示库里留下脏记录（seed-demo 只会在周日生成 checksPerWeek=1 的记录）。
  await test('4. 打卡与取消（失败也会回滚）', async () => {
    const button = page.locator('button[aria-label="打卡"]').first();
    toggledItemId = await button.getAttribute('data-item-id');
    if (!toggledItemId) throw new Error('打卡按钮缺少 data-item-id');

    const before = await page.locator('button[aria-label="取消打卡"]').count();
    try {
      await button.click();
      await waitLabel(toggledItemId, '取消打卡');
      const after = await page.locator('button[aria-label="取消打卡"]').count();
      if (after !== before + 1) throw new Error(`打卡后已打卡数 ${before} → ${after}，没加 1`);

      await page.reload();
      await page.waitForLoadState('networkidle');
      const reloaded = await page.locator('button[aria-label="取消打卡"]').count();
      if (reloaded !== after) throw new Error(`刷新后已打卡数变成 ${reloaded}，原为 ${after}`);

      await page.locator(`button[data-item-id="${toggledItemId}"]`).click();
      await waitLabel(toggledItemId, '打卡');
      const reverted = await page.locator('button[aria-label="取消打卡"]').count();
      if (reverted !== before) {
        throw new Error(`取消后已打卡数 ${after} → ${reverted}，应回到 ${before}`);
      }
    } finally {
      const current = page.locator(`button[data-item-id="${toggledItemId}"]`);
      if (
        (await current.count()) > 0 &&
        (await current.getAttribute('aria-label')) === '取消打卡'
      ) {
        try {
          await current.click();
          await waitLabel(toggledItemId, '打卡');
        } catch (e) {
          console.log(`   ⚠ 回滚未完成，演示库可能残留 1 条打卡记录：${e.message}`);
        }
      }
    }
  });

  await test('6. 报告页显示本家周表', async () => {
    await page.goto(`${BASE_URL}/report`);
    await page.waitForLoadState('networkidle');
    const body = await page.textContent('body');
    for (const token of ['周表', '本家本周得分', '潘SY', '徐L', '满分 50/人']) {
      if (!body.includes(token)) throw new Error(`未找到「${token}」`);
    }
    const match = body.match(/本家本周得分\s*(\d+)\s*\/\s*(\d+)/);
    if (!match) throw new Error('未找到本家总分');
    console.log(`   本家本周 ${match[1]}/${match[2]}`);
  });

  await test('7. 周次多选后出现趋势', async () => {
    const chips = page.locator('button[aria-pressed]');
    if ((await chips.count()) < 2) throw new Error('周次选择器没有可选项');
    await page.locator('button[aria-pressed="false"]').first().click();
    await page.waitForTimeout(400);
    const trends = await page.locator('[data-trend]').count();
    if (trends < 1) throw new Error('多选后未出现趋势图');
  });

  await test('8. 三种视图与柱状/折线切换', async () => {
    await page.getByRole('button', { name: '表格' }).click();
    await page.waitForTimeout(300);
    if ((await page.locator('table').count()) === 0) throw new Error('未切换到表格视图');
    if ((await page.locator('td.sticky').count()) === 0) throw new Error('表格里没有固定列');
    if (!(await page.textContent('body')).includes('本家合计')) throw new Error('表格缺少合计行');

    await page.getByRole('button', { name: '图表' }).click();
    await page.waitForTimeout(300);
    if ((await page.locator('svg').count()) === 0) throw new Error('未渲染图表');
    if ((await page.locator('svg rect').count()) === 0) throw new Error('柱状图没有柱子');

    await page.getByRole('button', { name: '折线' }).click();
    await page.waitForTimeout(300);
    if ((await page.locator('polyline').count()) === 0) throw new Error('折线模式没有折线');

    await page.getByRole('button', { name: '成员' }).click();
    await page.waitForTimeout(300);
  });

  // ---------- 管理端（独立会话，避免成员 cookie 干扰） ----------
  const adminContext = await browser.newContext({ viewport: { width: 1100, height: 900 } });
  const adminPage = await adminContext.newPage();
  adminPage.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`[admin] ${msg.text()}`);
  });
  adminPage.on('pageerror', (e) => errors.push(`[admin] JS 异常: ${e}`));

  await test('9. 管理员登录并打开周分录入', async () => {
    await login(adminPage, ADMIN);
    await adminPage.goto(`${BASE_URL}/admin/scores`);
    await adminPage.waitForLoadState('networkidle');
    const body = await adminPage.textContent('body');
    for (const token of ['周分录入', '成员', '本家合计', '自动', '恢复自动']) {
      if (!body.includes(token)) throw new Error(`未找到「${token}」`);
    }
  });

  await test('10. 录入某格后变为已锁定', async () => {
    const locked = () => adminPage.getByText('已锁定', { exact: true }).count();
    const before = await locked();

    const addButton = adminPage.locator('button[title="录入本周总分"]').first();
    if ((await addButton.count()) === 0) throw new Error('没有可录入的格子');
    await addButton.click();
    const input = adminPage.locator('input[inputmode="numeric"]').first();
    await input.fill('40');
    await input.press('Enter');
    await adminPage.waitForTimeout(1200);

    const after = await locked();
    if (after !== before + 1) throw new Error(`已锁定格数 ${before} → ${after}，没加 1`);
    if (!(await adminPage.textContent('body')).includes('40')) {
      throw new Error('录入的分数 40 没有显示');
    }
  });

  await test('11. 恢复自动', async () => {
    const locked = () => adminPage.getByText('已锁定', { exact: true }).count();
    const before = await locked();
    await adminPage.getByRole('button', { name: '恢复自动' }).first().click();
    await adminPage.waitForTimeout(1200);
    const after = await locked();
    if (after !== before - 1) throw new Error(`已锁定格数 ${before} → ${after}，没减 1`);
  });

  await test('12. 非法成员/团体被拒（不写入）', async () => {
    const res = await adminPage.request.put(`${BASE_URL}/api/admin/scores`, {
      data: {
        userId: 'not-exist',
        groupId: 'not-exist',
        weekStart: '2026-09-13',
        score: 10,
      },
    });
    if (res.status() < 400) throw new Error(`非法请求居然成功了（${res.status()}）`);
    console.log(`   返回 ${res.status()}`);
  });

  await test('13. 未登录不能录入', async () => {
    const anon = await browser.newContext();
    const res = await anon.request.put(`${BASE_URL}/api/admin/scores`, {
      data: { userId: 'x', groupId: 'y', weekStart: '2026-09-13', score: 10 },
    });
    await anon.close();
    if (res.status() !== 401) throw new Error(`未登录应返回 401，实际 ${res.status()}`);
  });

  await memberContext.close();
  await adminContext.close();
  await browser.close();

  await test('14. 控制台无 JavaScript 错误', async () => {
    if (errors.length > 0) throw new Error(errors.slice(0, 3).join(' | '));
  });

  const passed = results.filter((r) => r.status === 'ok').length;
  console.log('\n========== 测试总结 ==========');
  console.log(`总计: ${results.length} 项　通过: ${passed}　失败: ${results.length - passed}`);
  for (const r of results.filter((x) => x.status === 'fail')) {
    console.log(`❌ ${r.name}: ${r.error}`);
  }
  process.exit(results.some((r) => r.status === 'fail') ? 1 : 0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
