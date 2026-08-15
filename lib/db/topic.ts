import { Schema, model, models, type InferSchemaType } from 'mongoose';

const ObjectiveSchema = new Schema(
  {
    id: { type: String, required: true }, // 'M1.5.10'
    text: { type: String, required: true },
    notes: { type: String },
    assessable: { type: Boolean }, // R1.6 §3: absent/true = we can assess it
    unassessable_reason: { type: String },
  },
  { _id: false },
);

const TopicSchema = new Schema({
  module: { type: Number, enum: [1, 2, 3], required: true },
  code: { type: String, required: true, unique: true }, // 'M1-ALG1'
  title: { type: String, required: true },
  order: { type: Number, required: true }, // position within module
  objectives: { type: [ObjectiveSchema], required: true },
});

export type TopicDoc = InferSchemaType<typeof TopicSchema>;
export const Topic = models.Topic ?? model('Topic', TopicSchema);
