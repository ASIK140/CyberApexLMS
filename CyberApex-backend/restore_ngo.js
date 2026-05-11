const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run("UPDATE ngo_programs SET status = 'Approved' WHERE organization_name = 'Global Hope Network'", function(err) {
    if (err) {
      console.error(err);
    } else {
      console.log(`Updated ${this.changes} row(s)`);
    }
  });
});

db.close();
