from django.shortcuts import render_to_response
from django.http import HttpResponseRedirect, JsonResponse
from django.template import RequestContext, loader
from .forms import UploadFileForm
from .uploading import save_from_csv
from .models import SignupStats
import datetime
from django.core import serializers
import json
# Create your views here.


def index(request):
    # template = loader.get_template('dashboard/index.html')
    # return HttpResponse(template.render())
    return render_to_response('dashboard/static/app/dashboard/index.html')


def import_stats(request):
    if request.method == 'POST':
        form = UploadFileForm(request.POST, request.FILES)
        if form.is_valid():
            save_from_csv(request.FILES['file'])
            return HttpResponseRedirect('/')
    else:
        form = UploadFileForm()
    return render_to_response('dashboard/import.html', {'form': form}, context_instance=RequestContext(request))


def api(request):
    method = request.GET.get('method')
    if method == 'range':
        try:
            start = datetime.datetime.strptime(request.GET.get('start'), "%Y-%m-%d").date()
            end = datetime.datetime.strptime(request.GET.get('end'), "%Y-%m-%d").date()
        except ValueError:
            return JsonResponse({'error': 'request recieved in invalid format.'})
        except TypeError:
            return JsonResponse({'error': 'request recieved in invalid format.'})
        stats = SignupStats.objects.filter(date__range=(start, end))
        print "start %s end %s" % (start, end)
    else:
        # first query for stats within the year we want, or, if no year is specified, use this year by default.
        stats = SignupStats.objects.filter(date__year=request.GET.get('year', datetime.datetime.today().year))
        if request.GET.get('month', False):
            stats.filter(date__month=request.GET.get('month'))
    stats.extra(order_by='date')
    return JsonResponse({'message': 'hello world!', 'data': serializers.serialize('json', stats)})