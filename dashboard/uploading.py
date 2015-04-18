import csv
from .models import SignupStats
import datetime


def save_from_csv(f):
    r = csv.reader(f.read().splitlines())
    for row in r:
        # The first row won't compile, since it's words, so make sure we skip that
        try:
            d = datetime.datetime.strptime(row[0], "%m/%d/%Y").date()
        except ValueError:
            continue # skips the rest of this iteration if there's an error
        # Look for a db entry with the same date, if found, return it, if not, create it with data.
        stat, created = SignupStats.objects.get_or_create(date=d, defaults={
            'day_rep_signups': int(row[1]),
            'day_nonrep_signups':  int(row[2]),
            'aggregate_rep_signups': int(row[3]),
            'aggregate_total_signups':  int(row[4])
        })
        # If the entry WAS found (i.e. not created), update the data.
        if not created:
            stat.day_rep_signups = int(row[1])
            stat.day_nonrep_signups = int(row[2])
            stat.aggregate_rep_signups = int(row[3])
            stat.aggregate_total_signups = int(row[4])
            stat.save()