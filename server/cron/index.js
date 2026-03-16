const cron = require("node-cron");
const cleanupDeleteBlogs = require("../jobs/cleanupDeleteBlogs.job");

cron.schedule("0 3 * * * ", async () => {
  console.log("Running cleanup job...");
  await cleanupDeleteBlogs();
});
