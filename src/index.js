import * as store from './core/store.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`[FAILED] ${message}`);
    throw new Error(`Test failed: ${message}`);
  } else {
    console.log(`[SUCCESS] ${message}`);
  }
}

function runTests() {
  console.log("=== STARTING UNIT TESTS ===\n");

  try {
    // ---------------------------------------------------------
    // TEST 1: Clarify Publish Functionality
    // ---------------------------------------------------------
    console.log("--- Test 1: Publish Message ---");
    store.publish("order-topic", { orderId: 123, total: 50000 });
    
    const queues = store.getQueues();
    assert(queues.has("order-topic"), "'order-topic' topic must be created.");
    assert(queues.get("order-topic").length === 1, "Queue must contain 1 message.");
    console.log("\n");

    // ---------------------------------------------------------
    // TEST 2: Clarify Consume Functionality
    // ---------------------------------------------------------
    console.log("--- Test 2: Consume Message ---");
    const consumerId = "consumer-01";
    const consumedMessage = store.consume(consumerId, "order-topic");

    assert(consumedMessage !== undefined, "Consumed message must not be empty.");
    const queuesAfterConsume = store.getQueues();
    assert(queuesAfterConsume.has("order-topic") === false, "Topic queue must be deleted since it's empty after consumption.");

    const inflight = store.getInflight();
    assert(inflight.size === 1, "Message must be added to the inflight map.");

    const inflightId = Array.from(inflight.keys())[0];
    const inflightContent = inflight.get(inflightId);
    assert(inflightContent.id === consumedMessage.id, "Inflight message ID must match consumed message ID.");
    console.log("\n");

    // ---------------------------------------------------------
    // TEST 3: Clarify Acknowledgment (ACK) Functionality
    // ---------------------------------------------------------
    console.log("--- Test 3: Acknowledge (ACK) Message ---");
    const messageIdToAck = consumedMessage.id;
    store.ack(consumerId, messageIdToAck);

    const inflightAfterAck = store.getInflight();
    assert(inflightAfterAck.size === 0, "Inflight map must be empty after message is acknowledged.");
    console.log("\n");

    // ---------------------------------------------------------
    // TEST 4: Clarify Negative Acknowledgment (NACK) Functionality
    // ---------------------------------------------------------
    console.log("--- Test 4: Negative Acknowledge (NACK) & Retry ---");
    store.publish("order-topic", { orderId: 456 });
    const msgToNack = store.consume(consumerId, "order-topic");

    store.nack(consumerId, msgToNack.id);

    const inflightAfterNack = store.getInflight();
    assert(inflightAfterNack.size === 0, "Inflight must be empty after NACK triggers retry.");

    const queuesAfterNack = store.getQueues();
    assert(queuesAfterNack.has("order-topic") === true, "Message must return to the original queue.");
    
    const retriedMessage = queuesAfterNack.get("order-topic")[0];
    assert(retriedMessage.retry_count === 1, "Retry count must increment to 1.");
    console.log("\n");

    console.log("=== ALL UNIT TESTS PASSED CORRECTLY ===");
  } catch (error) {
    console.error("\nTESTING PROCESS STOPPED DUE TO AN ERROR.");
  }
}

runTests();
