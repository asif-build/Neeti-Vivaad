from django.core.management.base import BaseCommand
from courses.provider import IGOTCourseProvider

class Command(BaseCommand):
    help = 'Synchronize the real iGOT Karmayogi course catalog'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Synchronizing real iGOT Karmayogi courses..."))
        provider = IGOTCourseProvider()
        stats = provider.sync_courses()
        self.stdout.write(self.style.SUCCESS(
            f"Successfully synchronized iGOT catalog: Created {stats['created']}, "
            f"Updated {stats['updated']}, Total Active: {stats['total_active']}"
        ))
