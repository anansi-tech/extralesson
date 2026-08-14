import { Schema, model, models, type InferSchemaType } from 'mongoose';

const AllocationSchema = new Schema(
  {
    topic_codes: { type: [String], required: true },
    items: { type: Number }, // P1: number of items
    marks: { type: Number }, // P2: raw marks
  },
  { _id: false },
);

const BlueprintSchema = new Schema({
  paper: { type: String, enum: ['P1', 'P2'], required: true },
  module: { type: Number, enum: [1, 2, 3], required: true },
  allocations: { type: [AllocationSchema], required: true },
  // Raw marks (P2) or items (P1) per profile for this module.
  profile_split: {
    CK: { type: Number, required: true },
    AK: { type: Number, required: true },
    R: { type: Number, required: true },
  },
});

BlueprintSchema.index({ paper: 1, module: 1 }, { unique: true });

export type BlueprintDoc = InferSchemaType<typeof BlueprintSchema>;
export const Blueprint = models.Blueprint ?? model('Blueprint', BlueprintSchema);
