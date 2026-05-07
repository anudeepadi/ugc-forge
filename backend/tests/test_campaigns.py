import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_campaign_returns_201(client: AsyncClient):
    response = await client.post("/api/v1/campaigns", json={
        "product_name": "Test Serum",
        "product_description": "A test product for unit tests.",
        "niche": "dtc-skincare",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["product_name"] == "Test Serum"
    assert "id" in data


@pytest.mark.asyncio
async def test_create_campaign_generates_scripts(client: AsyncClient):
    response = await client.post("/api/v1/campaigns", json={
        "product_name": "Script Test",
        "product_description": "Used to verify scripts are generated.",
        "niche": "supplements",
    })
    assert response.status_code == 201
    campaign_id = response.json()["id"]

    scripts_resp = await client.get(f"/api/v1/campaigns/{campaign_id}/scripts")
    assert scripts_resp.status_code == 200
    scripts = scripts_resp.json()
    assert len(scripts) == 6
    assert all("hook" in s and "body" in s and "cta" in s for s in scripts)


@pytest.mark.asyncio
async def test_create_campaign_creates_render_jobs(client: AsyncClient):
    response = await client.post("/api/v1/campaigns", json={
        "product_name": "Render Test",
        "product_description": "Used to verify renders are queued.",
        "niche": "fitness",
    })
    campaign_id = response.json()["id"]

    renders_resp = await client.get(f"/api/v1/campaigns/{campaign_id}/renders")
    assert renders_resp.status_code == 200
    renders = renders_resp.json()
    assert len(renders) == 6
    assert all(r["status"] in ("queued", "processing", "complete") for r in renders)


@pytest.mark.asyncio
async def test_get_stats_returns_counts(client: AsyncClient):
    await client.post("/api/v1/campaigns", json={
        "product_name": "Stats Test",
        "product_description": "For stats endpoint.",
        "niche": "tech-gadgets",
    })
    stats_resp = await client.get("/api/v1/campaigns/stats")
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert stats["campaigns"] >= 1
    assert stats["scripts"] >= 6


@pytest.mark.asyncio
async def test_export_csv_returns_csv(client: AsyncClient):
    campaign_resp = await client.post("/api/v1/campaigns", json={
        "product_name": "Export Test",
        "product_description": "For CSV export.",
        "niche": "apparel",
    })
    campaign_id = campaign_resp.json()["id"]

    export_resp = await client.get(f"/api/v1/campaigns/{campaign_id}/export")
    assert export_resp.status_code == 200
    assert "text/csv" in export_resp.headers["content-type"]
    lines = export_resp.text.strip().split("\n")
    assert lines[0].startswith("render_id,script_id")
    assert len(lines) == 7  # header + 6 renders
