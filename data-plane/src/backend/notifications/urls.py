from django.urls import path

from . import views

urlpatterns = [
    path("config/", views.NotificationConfigView.as_view()),
    path("in-app/", views.InAppNotificationListView.as_view()),
]
