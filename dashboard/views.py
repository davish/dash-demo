from django.shortcuts import render_to_response
from django.http import HttpResponse
from django.template import RequestContext, loader
# Create your views here.


def index(request):
    # template = loader.get_template('dashboard/index.html')
    # return HttpResponse(template.render())
    return render_to_response('dashboard/static/app/dashboard/index.html')
