const test = require('ava');
const tmp = require('tmp');
const Database = require('../db');

let database = null;

async function expectThrow(t, fn) {
    try {
        await fn;
    } catch (err) {
        return;
    }
    t.fail('Function did not throw an error.');
}

test.before(async () => {
    const database_file = tmp.fileSync({ keep: true });
    console.log(`Database file is ${database_file.name}`);
    database = await Database.setup({ file: database_file.name });
});

test('globalSettings', async t => {
    t.is(await database.getGlobalValue(1234), undefined);
    t.is(await database.getGlobalValue(null), undefined);
    t.is(await database.getGlobalValue('test_key'), undefined);

    await expectThrow(t, database.setGlobalValue());
    await expectThrow(t, database.setGlobalValue(null));
    await expectThrow(t, database.setGlobalValue(''));

    await database.setGlobalValue('test_key');
    t.is(await database.getGlobalValue('test_key'), null);
    await database.setGlobalValue('test_key', 'test_value');
    t.is(await database.getGlobalValue('test_key'), 'test_value');
    await database.setGlobalValue('test_key', { value1: 'value1', value2: 'value2' });
    t.is((await database.getGlobalValue('test_key')).value1, 'value1');
    t.is((await database.getGlobalValue('test_key')).value2, 'value2');
    await database.setGlobalValue('test_key2', '?=+///z#;');
    t.is(await database.getGlobalValue('test_key2'), '?=+///z#;');

    const arr = await database.getGlobalValue();
    t.true(Array.isArray(arr));
    t.is(arr.length, 2);
});

test('skillSettings', async t => {
    t.is(await database.getSkillValue(1234, 2342), undefined);
    t.is(await database.getSkillValue(1234), undefined);
    t.is(await database.getSkillValue(null), undefined);
    t.is(await database.getSkillValue(undefined, 'test_key'), undefined);
    t.is(await database.getSkillValue('test_key'), undefined);

    await expectThrow(t, database.setSkillValue());
    await expectThrow(t, database.setSkillValue(null));
    await expectThrow(t, database.setSkillValue(''));
    await expectThrow(t, database.setSkillValue(null, ''));

    await database.setSkillValue('skill1', 'test_key');
    t.is(await database.getSkillValue('skill1', 'test_key'), null);
    await database.setSkillValue('skill1', 'test_key', 'value1');
    t.is(await database.getSkillValue('skill1', 'test_key'), 'value1');
    await database.setSkillValue('skill2', 'test_key2', '?=+///z#;');
    t.is(await database.getSkillValue('skill2', 'test_key2'), '?=+///z#;');

    const arr = await database.getSkillValue();
    t.true(Array.isArray(arr));
    t.is(arr.length, 2);
    const arr2 = await database.getSkillValue('skill1');
    t.true(Array.isArray(arr2));
    t.is(arr2.length, 1);
});

test('userSettings', async t => {
    await database.saveUser({ username: 'test', password: 'test', is_admin: true });

    t.is(await database.getValue(1234, 2342, 34534), undefined);
    t.is(await database.getValue(1234), undefined);
    t.is(await database.getValue(1234, '45345'), undefined);
    t.is(await database.getValue(null), undefined);
    t.is(await database.getValue(undefined, 'test_user'), undefined);
    t.is(await database.getValue('test_key'), undefined);

    await expectThrow(t, database.setValue());
    await expectThrow(t, database.setValue(null));
    await expectThrow(t, database.setValue(''));
    await expectThrow(t, database.setValue(null, ''));
    await expectThrow(t, database.setValue(null, '', ''));
    await expectThrow(t, database.setValue('skill1', { user_id: 1 }, 'test_key'));

    t.is(await database.getValue('skill1', { user_id: 1 }, 'test_key'), undefined);
    await database.setValue('skill1', { user_id: 1 }, 'test_key', 'value1');
    t.is(await database.getValue('skill1', { user_id: 1 }, 'test_key'), 'value1');
    await database.setValue('skill2', { user_id: 1 }, 'test_key2', '?=+///z#;');
    t.is(await database.getValue('skill2', { user_id: 1 }, 'test_key2'), '?=+///z#;');
});

test('multiSetup', async t => {
    const multi_database_file = tmp.fileSync();
    await t.notThrows(async () => {
        for (let i = 0; i < 5; i++) {
            const multi_database = await Database.setup({ file: multi_database_file.name });
            await multi_database.close();
        }
    });
});

test.after(async () => {
    await database.close();
});
