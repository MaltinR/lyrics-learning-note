class SongMetadata:
    title: str
    duration_seconds: float

    def __init__(self, title: str, duration_seconds: float):
        self.title = title
        self.duration_seconds = duration_seconds