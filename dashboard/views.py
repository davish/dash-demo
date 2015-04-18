from django.shortcuts import render_to_response
from django.http import HttpResponseRedirect
from django.template import RequestContext, loader
from django.contrib.admin.views.decorators import staff_member_required
from .forms import UploadFileForm
from .uploading import save_from_csv
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
            return HttpResponseRedirect('thanks/')
    else:
        form = UploadFileForm()
    return render_to_response('dashboard/import.html', {'form': form}, context_instance=RequestContext(request))