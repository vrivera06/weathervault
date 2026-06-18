from django.urls import path
from . import views

urlpatterns = [
    path("current/",         views.current_weather, name="current-weather"),
    path("historical/",      views.historical,      name="historical"),
    path("weekly-summary/",  views.weekly_summary,  name="weekly-summary"),
    path("monthly-summary/", views.monthly_summary, name="monthly-summary"),
    path("correlative/",     views.correlative,     name="correlative"),
    path("stations/",        views.stations,        name="stations"),
    path("chat/",            views.chat,            name="chat"),
]
