import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Campaign(Base):
    __tablename__ = "campaigns"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    product_name: Mapped[str] = mapped_column(String(255))
    product_url: Mapped[str] = mapped_column(String(2048), default="")
    product_description: Mapped[str] = mapped_column(Text)
    niche: Mapped[str] = mapped_column(String(100))
    target_audience: Mapped[str] = mapped_column(Text, default="")
    claims_and_proof: Mapped[str] = mapped_column(Text, default="")
    script_tone: Mapped[str] = mapped_column(String(100), default="casual-founder")
    voice_style: Mapped[str] = mapped_column(String(100), default="warm-authentic")
    status: Mapped[str] = mapped_column(String(50), default="ready")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    scripts: Mapped[list["Script"]] = relationship(back_populates="campaign", cascade="all, delete-orphan")
    renders: Mapped[list["Render"]] = relationship(back_populates="campaign", cascade="all, delete-orphan")
