from django.core.management.base import BaseCommand
from courses.provider import IGOTCourseProvider


class Command(BaseCommand):
    help = 'Synchronize the real iGOT Karmayogi course catalog from official sources'

    def add_arguments(self, parser):
        parser.add_argument(
            '--limit',
            type=int,
            default=None,
            help='Maximum number of real courses to fetch and sync (e.g. 1000, or omit for all available).'
        )
        parser.add_argument(
            '--source',
            type=str,
            default='all',
            choices=['all', 'sunbird', 'content_list'],
            help='Specific official source to sync from (default: all).'
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=200,
            help='Batch size for database upsert operations (default: 200).'
        )

    def handle(self, *args, **options):
        limit = options.get('limit')
        source = options.get('source')
        batch_size = options.get('batch_size') or 200

        self.stdout.write(self.style.NOTICE(
            f"Starting official iGOT Karmayogi catalogue synchronization (source={source}, limit={limit or 'ALL'})..."
        ))

        provider = IGOTCourseProvider()
        stats = provider.sync_courses(limit=limit, source=source, batch_size=batch_size)

        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(self.style.SUCCESS("iGOT Karmayogi Synchronization Completed Successfully"))
        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(f"  Source Used:     {stats.get('source_used')}")
        self.stdout.write(f"  Total Fetched:   {stats.get('fetched')}")
        self.stdout.write(f"  Newly Created:   {stats.get('created')}")
        self.stdout.write(f"  Updated:         {stats.get('updated')}")
        self.stdout.write(f"  Unchanged:       {stats.get('unchanged')}")
        self.stdout.write(f"  Failed/Skipped:  {stats.get('failed')}")
        self.stdout.write(self.style.SUCCESS(f"  Total Active in DB: {stats.get('total_active')}"))
        self.stdout.write(f"  Sync Timestamp:  {stats.get('last_synced_at')}")
        self.stdout.write(self.style.SUCCESS("=" * 60))
