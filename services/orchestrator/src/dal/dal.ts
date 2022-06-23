const model_db = require('./models'); // eslint-disable-line @typescript-eslint/no-var-requires

// gross syncing solution as sync() must be called in each method
let synced = false;

async function sync() {
  if (synced)
    return;

  await model_db.sequelize.sync();
  synced = true;
}

async function getLastBlock() {
  await sync();
  return model_db.LastBlock.findOne({
    where: { key: 'LastBlock' }
  });
}

async function createLastBlock(lastBlackNum) {
  await sync();
  const lastBlock = await getLastBlock();
  if (!lastBlock) {
    await model_db.LastBlock.create({ key: 'LastBlock', last_block: lastBlackNum });
  }
}

async function createUsageInfo(key, imageName) {
  await sync();
  const res = await model_db.UsageInfo.findOne({
    where: { key }
  });
  if (!res) {
    try {
      // console.log(`creating: ${key} ${imageName}`)
      return model_db.UsageInfo.create({ key, imageName });
      // return model_db.UsageInfo.create({ key, dockerId, io_usage:0, storage_usage:0 });
    }
    catch (e) {
      if (e.name === 'SequelizeOptimisticLockError')
        createUsageInfo(key, imageName);
      else throw e;
    }
  }
  return res;
}

// async function getUsageInfo(key) {
//   await sync();
//   return model_db.UsageInfo.findOne({
//     where: { key }
//   });
// }

// pass in new fields to be set
// async function updateUsageInfo(key, io_usage, storage_usage, last_io_usage) {
//   await sync();
//   try {
//     const usageInfo = await getUsageInfo(key);
//     if (usageInfo === null) {
//       return false;
//     }
//     usageInfo.io_usage = io_usage;
//     usageInfo.last_io_usage = last_io_usage;
//     usageInfo.storage_usage = storage_usage;
//     await usageInfo.save();
//     return true;
//   }
//   catch (e) {
//     // handle
//     console.error('error updating svc req', e)
//     throw e;
//   }
// }

async function removeUsageInfo(key) {
  await sync();
  return await model_db.UsageInfo.destroy({
    where: { key }
  });
}

async function fetchAllUsageInfo() {
  await sync();
  const res = await model_db.UsageInfo.findAll();
  if (!res) {
    return;
  }
  return res;
}

module.exports = {
  getLastBlock,
  createLastBlock,
  // getUsageInfo,
  createUsageInfo,
  // updateUsageInfo,
  fetchAllUsageInfo,
  removeUsageInfo
};

