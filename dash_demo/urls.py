from django.conf.urls import include, url
from django.contrib import admin
from dashboard import views
urlpatterns = [
    # Examples:
    # url(r'^$', 'dash_demo.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),

    url(r'^admin/', include(admin.site.urls)),
    url(r'^dashboard/', include('dashboard.urls')),
    # url(r'^$', 'dashboard.views.index', name='home')
]

from . import settings
if settings.DEBUG:
    urlpatterns += url(
        r'^$', 'django.contrib.staticfiles.views.serve', kwargs={
            'path': 'app/dashboard/index.html'}),
