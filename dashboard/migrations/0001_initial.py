# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='SignupStats',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('date', models.DateField()),
                ('day_rep_signups', models.IntegerField(verbose_name=b'Daily signups from reps')),
                ('day_nonrep_signups', models.IntegerField(verbose_name=b'Non-rep signup #')),
                ('aggregate_rep_signups', models.IntegerField(verbose_name=b'Total rep signups to date')),
                ('aggregate_total_signups', models.IntegerField(verbose_name=b'Total signups to date')),
            ],
        ),
    ]
