#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { generateDerivedHouseData } from "../src/server/house-model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const serverPath = path.resolve(projectRoot, "src/mcp-server/index.js");
const researchQueueDataPath = path.resolve(projectRoot, "data/research-queue.json");
const researchQueuePublicPath = path.resolve(projectRoot, "public/research-queue.json");

function parseTextPayload(result) {
  assert.ok(!("toolResult" in result), "Expected standard tool content result");
  assert.ok(Array.isArray(result.content) && result.content.length > 0, "Expected tool response content");
  const textBlock = result.content.find((entry) => entry.type === "text");
  assert.ok(textBlock && typeof textBlock.text === "string", "Expected tool response text");
  return JSON.parse(textBlock.text);
}

async function main() {
  console.log("Testing MCP Server...\n");
  const originalResearchQueue = JSON.parse(await fs.readFile(researchQueueDataPath, "utf8"));

  const transport = new StdioClientTransport({
    command: "node",
    args: [serverPath],
    cwd: projectRoot,
    stderr: "pipe",
  });

  if (transport.stderr) {
    transport.stderr.on("data", (chunk) => {
      process.stderr.write(chunk);
    });
  }

  const client = new Client(
    {
      name: "git-stars-test-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    },
  );

  try {
    await client.connect(transport);

    const listedTools = await client.listTools();
    const toolNames = new Set(listedTools.tools.map((tool) => tool.name));
    [
      "list_news_signals",
      "get_research_queue",
      "update_research_queue",
      "get_adoption_candidates",
      "extract_repo_skills",
      "generate_repo_mission",
      "get_mine_health",
    ].forEach((toolName) => {
      assert.ok(toolNames.has(toolName), `Expected MCP tool to exist: ${toolName}`);
    });

    const statsResult = parseTextPayload(await client.callTool({
      name: "get_statistics",
      arguments: {},
    }));
    assert.ok(typeof statsResult === "object" && statsResult !== null, "Statistics payload should be an object");

    const newsResult = parseTextPayload(await client.callTool({
      name: "list_news_signals",
      arguments: { scope: "watched", limit: 5 },
    }));
    assert.ok(Array.isArray(newsResult.signals) && newsResult.signals.length > 0, "News signals should return results");

    const targetSignal = newsResult.signals[0];
    const [author, name] = String(targetSignal.nwo || "").split("/");
    assert.ok(author && name, "Signal should include a valid nwo");

    const queueBefore = parseTextPayload(await client.callTool({
      name: "get_research_queue",
      arguments: {},
    }));
    assert.ok(Array.isArray(queueBefore.queue), "Research queue should be an array");

    const updateOne = parseTextPayload(await client.callTool({
      name: "update_research_queue",
      arguments: {
        author,
        name,
        status: "queued",
        priority: "high",
        notes: "Automated MCP queue verification",
      },
    }));
    assert.equal(updateOne.updated, true, "Research queue update should report success");
    assert.equal(updateOne.item.nwo, `${author}/${name}`, "Updated queue item should match the target repo");

    const updateTwo = parseTextPayload(await client.callTool({
      name: "update_research_queue",
      arguments: {
        author,
        name,
        status: "researching",
        priority: "high",
        notes: "Automated MCP dedupe verification",
      },
    }));
    assert.equal(updateTwo.updated, true, "Second research queue update should report success");
    assert.equal(updateTwo.item.status, "researching", "Second update should overwrite the queue status");

    const queueAfter = parseTextPayload(await client.callTool({
      name: "get_research_queue",
      arguments: {},
    }));
    assert.ok(Array.isArray(queueAfter.queue), "Updated research queue should be an array");
    assert.ok(
      queueAfter.queue.length >= queueBefore.queue.length && queueAfter.queue.length <= queueBefore.queue.length + 1,
      "Research queue updates should not create duplicate entries",
    );
    const updatedItem = queueAfter.queue.find((item) => item.nwo === `${author}/${name}`);
    assert.ok(updatedItem, "Updated repository should be present in the research queue");
    assert.equal(updatedItem.status, "researching", "Queue item should retain the latest status");

    const researchSignals = parseTextPayload(await client.callTool({
      name: "list_news_signals",
      arguments: { scope: "research", limit: 10 },
    }));
    assert.ok(
      Array.isArray(researchSignals.signals) && researchSignals.signals.some((signal) => signal.nwo === `${author}/${name}`),
      "Research scope signals should surface queued repositories",
    );

    const extractionResult = parseTextPayload(await client.callTool({
      name: "extract_repo_skills",
      arguments: { author, name },
    }));
    assert.equal(extractionResult.nwo, `${author}/${name}`, "Skill extraction should match the target repo");
    assert.ok(Array.isArray(extractionResult.capabilities) && extractionResult.capabilities.length > 0, "Skill extraction should expose capabilities");
    assert.ok(Array.isArray(extractionResult.houseSkills), "Skill extraction should expose house skills");
    assert.ok(Array.isArray(extractionResult.rules), "Skill extraction should expose rules");
    assert.ok(Array.isArray(extractionResult.flows), "Skill extraction should expose flows");

    const codexMission = parseTextPayload(await client.callTool({
      name: "generate_repo_mission",
      arguments: { author, name, target: "codex" },
    }));
    assert.equal(codexMission.target, "codex", "Codex mission should report its target");
    assert.equal(typeof codexMission.mission, "string", "Codex mission should be a string");
    assert.ok(codexMission.mission.length > 20, "Codex mission should be non-trivial");

    const claudeMission = parseTextPayload(await client.callTool({
      name: "generate_repo_mission",
      arguments: { author, name, target: "claude" },
    }));
    assert.equal(claudeMission.target, "claude", "Claude mission should report its target");
    assert.equal(typeof claudeMission.mission, "string", "Claude mission should be a string");
    assert.ok(claudeMission.mission.length > 20, "Claude mission should be non-trivial");

    const adoptionResult = parseTextPayload(await client.callTool({
      name: "get_adoption_candidates",
      arguments: { limit: 5 },
    }));
    assert.ok(Array.isArray(adoptionResult.candidates) && adoptionResult.candidates.length > 0, "Adoption candidates should return ranked repos");
    if (adoptionResult.candidates.length > 1) {
      assert.ok(
        adoptionResult.candidates[0].adoptionScore >= adoptionResult.candidates[adoptionResult.candidates.length - 1].adoptionScore,
        "Adoption candidates should be ranked by descending score",
      );
    }

    const mineHealth = parseTextPayload(await client.callTool({
      name: "get_mine_health",
      arguments: {},
    }));
    assert.ok(Array.isArray(mineHealth.records) && mineHealth.records.length > 0, "Mine health should return owned-repo records");
    assert.ok(
      mineHealth.records.every((record) => Array.isArray(record.healthFlags) && Array.isArray(record.recommendedActions)),
      "Mine health records should include deterministic flags and actions",
    );

    console.log("✅ MCP Server test completed");
  } finally {
    await client.close().catch(() => undefined);
    const restoredQueue = `${JSON.stringify(originalResearchQueue, null, 2)}\n`;
    await fs.writeFile(researchQueueDataPath, restoredQueue, "utf8");
    await fs.writeFile(researchQueuePublicPath, restoredQueue, "utf8");
    await generateDerivedHouseData(projectRoot);
  }
}

main().catch((error) => {
  console.error("❌ MCP Server test failed");
  console.error(error);
  process.exit(1);
});
