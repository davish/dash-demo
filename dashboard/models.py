from django.db import models

# Create your models here.


class SignupStats(models.Model):
    date = models.DateField()
    day_rep_signups = models.IntegerField("Daily signups from reps")
    day_nonrep_signups = models.IntegerField("Daily non-rep signup #")
    aggregate_rep_signups = models.IntegerField("Total rep signups to date")
    aggregate_total_signups = models.IntegerField("Total signups to date")

    def __str__(self):
        return self.aggregate_total_signups
