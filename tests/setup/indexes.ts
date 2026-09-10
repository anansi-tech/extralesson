import { beforeEach } from 'vitest';
import mongoose from 'mongoose';

/**
 * INDEXES BEFORE FIXTURES, FOR EVERY FILE THAT WRITES ANY.
 *
 * Mongoose builds a model's indexes in the background once the model is first
 * used, and a fixture written through the driver — Model.collection.insertOne
 * and friends, which most of this suite uses — races that build. A fixture that
 * breaks a unique index therefore inserts cleanly when it wins the race and is
 * rejected when it loses: a test that passes by luck, and fails once in fifty
 * runs under load. One did, on Attempt.
 *
 * Thirty of the thirty-six files that touch a database began work with at least
 * one declared unique index still missing, so this belongs here rather than in
 * each of them. It runs before every test, after the file's own beforeAll has
 * connected; init() is memoised per model, so only the first call in a file
 * costs anything.
 */
beforeEach(async () => {
  if (mongoose.connection.readyState !== 1) return;
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
});
