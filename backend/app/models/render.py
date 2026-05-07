import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Render(Base):
    __tablename__ = "renders"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    campaign_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="CASCADE")
    )
    script_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("scripts.id", ondelete="CASCADE")
    )
    avatar: Mapped[str] = mapped_column(String(100), default="Avatar A")
    voice: Mapped[str] = mapped_column(String(100), default="Warm")
    status: Mapped[str] = mapped_column(String(50), default="queued")
    progress: Mapped[int] = mapped_column(Integer, default=0)
    video_url: Mapped[str | None] = mapped_column(String(2048), default=None)
    video_url_portrait: Mapped[str | None] = mapped_column(String(2048), default=None)
    video_url_square: Mapped[str | None] = mapped_column(String(2048), default=None)
    video_url_landscape: Mapped[str | None] = mapped_column(String(2048), default=None)
    duration_seconds: Mapped[float | None] = mapped_column(Float, default=None)
    error_message: Mapped[str | None] = mapped_column(String(1024), default=None)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    campaign: Mapped["Campaign"] = relationship(back_populates="renders")
    script: Mapped["Script"] = relationship(back_populates="renders")
