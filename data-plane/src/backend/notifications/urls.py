from django.urls import path

from . import views

urlpatterns = [
    path("config/", views.NotificationConfigView.as_view()),
    path("config/test/", views.NotificationConfigTestView.as_view()),
    path("in-app/", views.InAppNotificationListView.as_view()),
    path("in-app/mark-all-read/", views.InAppNotificationMarkAllReadView.as_view()),
    path("in-app/<int:pk>/mark-read/", views.InAppNotificationMarkReadView.as_view()),
    path("in-app/<int:pk>/mark-unread/", views.InAppNotificationMarkUnreadView.as_view()),
]
