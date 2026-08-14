import { describe, expect, it } from 'vitest';
import lunaJson from '@/design/research/question-bank-pilot-evaluation.json';
import terraJson from '@/design/research/question-bank-pilot-evaluation-terra.json';
import m3LunaJson from '@/design/research/question-bank-m3-pilot-evaluation-luna-stored.json';
import m3TerraJson from '@/design/research/question-bank-m3-pilot-evaluation-terra.json';
import {
  calibratePilotEvaluators,
  PilotEvaluationForCalibrationZ,
} from '@/lib/generation/pilot-calibration';

describe('pilot evaluator calibration', () => {
  it('approves Luna for first-pass review with Terra escalation', () => {
    const result = calibratePilotEvaluators(
      PilotEvaluationForCalibrationZ.parse(lunaJson),
      PilotEvaluationForCalibrationZ.parse(terraJson),
    );

    expect(result.agreement.core_classification_bps).toBe(8333);
    expect(result.agreement.readiness_bps).toBe(10_000);
    expect(result.agreement.concerns_bps).toBe(10_000);
    expect(result.same_pilot_gate).toBe(true);
    expect(result.same_gate_failures).toBe(true);
    expect(result.routing.primary_first_pass_approved).toBe(true);
    expect(result.routing.frontier_adjudication_needed).toBe(false);
  });

  it('requires Terra for M3 cognitive classification', () => {
    const result = calibratePilotEvaluators(
      PilotEvaluationForCalibrationZ.parse(m3LunaJson),
      PilotEvaluationForCalibrationZ.parse(m3TerraJson),
    );

    expect(result.agreement.core_classification_bps).toBe(0);
    expect(result.agreement.readiness_bps).toBe(10_000);
    expect(result.agreement.concerns_bps).toBe(10_000);
    expect(result.routing.decision).toBe('comparator-required');
    expect(result.routing.primary_first_pass_approved).toBe(false);
  });
});
