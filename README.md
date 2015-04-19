# dash-demo

## Loading Data

- Data is loaded into the PostgreSQL database via a webpage at `/dashboard/update`
(`import_stats` in `dashboard/views.py`) that takes a .csv file.
- The file, when sent to the server, is parsed line-by-line by `dashboard/uploading.py`.
     - Here, a line is checked to see if there is already a database entry that has the same date.
     - If there isn't, the line is inserted into the DB. Otherwise, the data is updated.

## Spec

* line graph of signups, viewable by day, week, month
* signups from reps overtime compared to non-rep signups
* rep signups as a % of overall growth over time
* cumulative growth over time, on a % weekly growth basis
* Anything else you think would be valuable!

- data needs to be loaded dynamically into PostgreSQL