from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^update/', views.import_stats, name='update'),
]

