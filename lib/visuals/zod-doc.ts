import { z } from 'zod';

// Each template's params contract, injected into the draft prompt. Derived
// from the schema itself, so the contract cannot drift from validation.
export function zodDoc(schema: z.ZodTypeAny): string {
  return describe(schema);
}

function describe(schema: z.ZodTypeAny): string {
  const def = schema._def as { typeName: z.ZodFirstPartyTypeKind } & Record<string, unknown>;
  switch (def.typeName) {
    case z.ZodFirstPartyTypeKind.ZodObject: {
      const shape = (schema as z.AnyZodObject).shape;
      const fields = Object.entries(shape).map(
        ([k, v]) => `${k}${isOptionalish(v as z.ZodTypeAny) ? '?' : ''}: ${describe(v as z.ZodTypeAny)}`,
      );
      return `{ ${fields.join(', ')} }`;
    }
    case z.ZodFirstPartyTypeKind.ZodArray: {
      const el = describe(def.type as z.ZodTypeAny);
      const exact = (def.exactLength as { value: number } | null)?.value;
      if (exact != null) return `[${el} × ${exact}]`;
      const min = (def.minLength as { value: number } | null)?.value;
      const max = (def.maxLength as { value: number } | null)?.value;
      const bounds = min != null || max != null ? ` (${min ?? 0}-${max ?? '∞'})` : '';
      return `${el}[]${bounds}`;
    }
    case z.ZodFirstPartyTypeKind.ZodString: {
      const checks = (def.checks as { kind: string; value?: number }[]) ?? [];
      const max = checks.find((c) => c.kind === 'max')?.value;
      return max != null ? `string (<=${max} chars)` : 'string';
    }
    case z.ZodFirstPartyTypeKind.ZodNumber: {
      const checks = (def.checks as { kind: string; value?: number }[]) ?? [];
      const int = checks.some((c) => c.kind === 'int');
      const min = checks.find((c) => c.kind === 'min')?.value;
      const max = checks.find((c) => c.kind === 'max')?.value;
      const range = min != null || max != null ? ` ${min ?? ''}..${max ?? ''}` : '';
      return `${int ? 'integer' : 'number'}${range}`;
    }
    case z.ZodFirstPartyTypeKind.ZodBoolean:
      return 'boolean';
    case z.ZodFirstPartyTypeKind.ZodEnum:
      return (def.values as string[]).map((v) => `"${v}"`).join(' | ');
    case z.ZodFirstPartyTypeKind.ZodLiteral:
      return JSON.stringify(def.value);
    case z.ZodFirstPartyTypeKind.ZodOptional:
    case z.ZodFirstPartyTypeKind.ZodNullable:
      return describe(def.innerType as z.ZodTypeAny);
    case z.ZodFirstPartyTypeKind.ZodDefault:
      return `${describe(def.innerType as z.ZodTypeAny)} (default ${JSON.stringify(
        (def.defaultValue as () => unknown)(),
      )})`;
    case z.ZodFirstPartyTypeKind.ZodUnion:
      return (def.options as z.ZodTypeAny[]).map(describe).join(' | ');
    case z.ZodFirstPartyTypeKind.ZodDiscriminatedUnion:
      return (def.options as z.ZodTypeAny[]).map(describe).join(' | ');
    case z.ZodFirstPartyTypeKind.ZodTuple:
      return `[${(def.items as z.ZodTypeAny[]).map(describe).join(', ')}]`;
    case z.ZodFirstPartyTypeKind.ZodRecord:
      return `record<string, ${describe(def.valueType as z.ZodTypeAny)}>`;
    case z.ZodFirstPartyTypeKind.ZodEffects:
      return describe(def.schema as z.ZodTypeAny);
    default:
      return 'unknown';
  }
}

function isOptionalish(schema: z.ZodTypeAny): boolean {
  const t = (schema._def as { typeName: z.ZodFirstPartyTypeKind }).typeName;
  return (
    t === z.ZodFirstPartyTypeKind.ZodOptional || t === z.ZodFirstPartyTypeKind.ZodDefault
  );
}
