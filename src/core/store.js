import crypto from "crypto";

const queues = new Map(); // Topics and their queues
const inflight = new Map(); // Unacknowledged contents and messages within

export function publish(topic, message) {

  if (!queues.has(topic)) {
    const queue = [];
    queues.set(topic, queue);
		console.log(`(store.publish): Created new queue for topic: ${topic}`);
  }

  const content = {
    id: crypto.randomBytes(6).toString('hex'),
    payload: message,
    retry_count: 0,
    created_at: Date.now(),
  }

  queues.get(topic).push(content);
	console.log(`(store.publish): Published message to topic: ${topic}, content ID: ${content.id}, content: ${JSON.stringify(message)}`);
}

function republish(topic, content) {
	if (!queues.has(topic)) {
		const queue = [];
		queues.set(topic, queue);
		console.log(`(store.republish): Created new queue for republishing to topic: ${topic}`);
	}

	queues.get(topic).push(content);
	console.log(`(store.republish): Republished message to topic: ${topic}, content ID: ${content.id}, content: ${JSON.stringify(content.payload)}`);
}

function removeMessageFromQueue(topic, contentId) {
	if (!queues.has(topic)) {
		console.log(`(store.removeMessageFromQueue): Topic not found for removal: ${topic}`);
		return;
	}
	
	const queue = queues.get(topic);
	const index = queue.findIndex(content => content.id === contentId);

	if (index === -1) {
		console.log(`(store.removeMessageFromQueue): Content ID not found in queue for topic: ${topic}, content ID: ${contentId}`);
		return;
	}

	const removedContent = queue.splice(index, 1);
	console.log(`(store.removeMessageFromQueue): Message removed from queue: ${contentId} in topic: ${topic}, removed content: ${JSON.stringify(removedContent)}`);

	if (queue.length === 0) {
		removeQueue(topic);
	}
}

function removeQueue(topic) {
	if (queues.has(topic)) {
		queues.delete(topic);
		console.log(`(store.removeQueue): Queue removed for topic: ${topic}`);
	} else {
		console.log(`(store.removeQueue): Queue not found for removal: ${topic}`);
	}
}

export function consume(consumerId, topic) {
	const queue = queues.get(topic);
  const content = queue.shift();

  if (content) {
		console.log(`(store.consume): Consuming message from topic: ${topic}, content ID: ${content.id}, content: ${JSON.stringify(content.payload)}`);
		const inflightId = pushMessageToInflight(consumerId, topic, content);
		console.log(
			`(store.consume): Message consumed by ${consumerId} from topic: ${topic}, content ID: ${content.id}, inflight ID: ${inflightId}`
		);
  }

	if (queue.length === 0) {
		removeQueue(topic);
	}

  return content;
}

function pushMessageToInflight(consumerId, topic, content) {
	const inflightId = crypto.randomBytes(6).toString('hex');
	
	content = {
			...content,
			inflight: {
					consumer_id: consumerId,
					from_topic: topic,
					created_at: Date.now(),
			},
	}

	inflight.set(inflightId, content);
	console.log(`(store.pushMessageToInflight): Message pushed to inflight: ${inflightId}, content ID: ${content.id}`);

	return inflightId;
}

function removeMessageFromInflight(inflightId) {
	if (inflight.has(inflightId)) {
		const content = inflight.get(inflightId);
		inflight.delete(inflightId);
		console.log(`(store.removeMessageFromInflight): Message removed from inflight: ${inflightId}, content ID: ${content.id}`);
	} else {
		console.log(`(store.removeMessageFromInflight): Inflight ID not found for removal: ${inflightId}`);
	}
}

export function ack(consumerId, contentId) {
	for (const [inflightId, content] of inflight.entries()) {
		if (content.id !== contentId && content.inflight.consumer_id !== consumerId) {
			console.log(`(store.ack): Message not found for acknowledgment: ${contentId} and consumer: ${consumerId}`);
			return;
		}

		removeMessageFromInflight(inflightId);
		console.log(`(store.ack): Message acknowledged: ${contentId} and removed from inflight: ${inflightId}`);
		return;
	}
}

export function nack(consumerId, contentId) {
	for (const [inflightId, content] of inflight.entries()) {
		if (content.id !== contentId && content.inflight.consumer_id !== consumerId) {
			console.log(`(store.nack): Message not found for negative acknowledgment: ${contentId} and consumer: ${consumerId}`);
			return;
		}

		retry(inflightId);
		console.log(`(store.nack): Message negatively acknowledged: ${contentId} has been processed`);
		return;
	}
}

export function unack(consumerId, contentId) {
	for (const [inflightId, content] of inflight.entries()) {
		if (content.id !== contentId && content.inflight.consumer_id !== consumerId) {
			console.log(`(store.unack): Message not found for unacknowledgment: ${contentId} and consumer: ${consumerId}`);
			return;
		}

		retry(inflightId);
		console.log(`(store.unack): Message unacknowledged: ${contentId} has been processed`);
		return;
	}
}

function retry(inflightId) {
	if (!inflight.has(inflightId)) {
		console.log(`(store.retry): Inflight ID not found for retry: ${inflightId}`);
		return;
	}

	const content = inflight.get(inflightId);
	content.retry_count += 1;
	republish(content.inflight.from_topic, content);
	removeMessageFromInflight(inflightId);
	console.log(`(store.retry): Message retried and republished to topic: ${content.inflight.from_topic}, content ID: ${content.id}`);
}

export function getQueues() {
	console.log(`(store.getQueues): Retrieving all queues`);
	return queues;
}

export function getInflight() {
	console.log(`(store.getInflight): Retrieving all inflight messages`);
	return inflight;
}