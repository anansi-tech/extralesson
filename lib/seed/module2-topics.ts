import type { SeedTopic } from './types';

// Transcribed from design/syllabus-2027.pdf, Module 2 (PDF pages ~35–47).
// Objective ids follow syllabus numbering: 'M2.<topic>.<objective>'.
export const module2Topics: SeedTopic[] = [
  {
    module: 2,
    code: 'M2-STAT1',
    title: 'Statistics 1',
    order: 1,
    // PDF page 36
    objectives: [
      {
        id: 'M2.1.1',
        text: 'Differentiate between sample and population attributes.',
        notes: 'Sample statistics and population parameters.',
      },
      {
        id: 'M2.1.2',
        text: 'Construct a frequency table for a given set of data.',
        notes: 'Discrete variables. Ungrouped data.',
      },
      {
        id: 'M2.1.3',
        text: 'Construct statistical diagrams.',
        notes: 'Pie charts and bar charts.',
      },
      {
        id: 'M2.1.4',
        text: 'Determine measures of central tendency for raw ungrouped data.',
        notes: 'Ungrouped data: mean, median and mode.',
      },
      {
        id: 'M2.1.5',
        text: 'Determine when it is most appropriate to use the mean, median and mode as the average for a set of data.',
        notes:
          'Levels of measurement (measurement scales): nominal, ordinal, interval and ratio. Sets with extreme values or recurring values.',
      },
      {
        id: 'M2.1.6',
        text: 'Determine the measures of dispersion (spread) for raw, ungrouped data.',
        notes: 'Range, interquartile range and semi-interquartile range.',
      },
      {
        id: 'M2.1.7',
        text: 'Analyse statistical diagrams.',
        notes:
          'Finding the mean, mode, median, range, quartiles, interquartile range, semi-interquartile range; trends and patterns.',
      },
      {
        id: 'M2.1.8',
        text: 'Use standard deviation to compare sets of ungrouped data.',
        notes: 'No calculation of the standard deviation will be required.',
      },
      {
        id: 'M2.1.9',
        text: 'Determine the proportion or percentage of the sample above or below a given value from raw ungrouped data or frequency table.',
      },
      {
        id: 'M2.1.10',
        text: 'Identify the sample space for a simple experiment.',
        notes: 'Including the use of coins, dice and playing cards. Simple probabilities.',
      },
      {
        id: 'M2.1.11',
        text: 'Make inference(s) from statistics.',
        notes: 'Raw data, tables, diagrams, summary statistics.',
      },
    ],
  },
  {
    module: 2,
    code: 'M2-ALG2',
    title: 'Algebra 2',
    order: 2,
    // PDF page 37
    objectives: [
      {
        id: 'M2.2.1',
        text: 'Factorise algebraic expressions.',
        notes:
          'Expressions of the type: a^2 - b^2; ax + bx + ay + by; ax^2 + bx + c, where a, b and c are integers and a is not equal to 0.',
      },
      {
        id: 'M2.2.2',
        text: 'Change the subject of formulae.',
        notes:
          'Equations of the type to include: V = (4/3)pi r^3; T = 2 pi sqrt(l/g); M = sqrt(P + 2M).',
      },
      {
        id: 'M2.2.3',
        text: 'Solve simultaneous linear equations, in two unknowns, algebraically.',
      },
      {
        id: 'M2.2.4',
        text: 'Rewrite a quadratic expression in the form a(x + h)^2 + k.', // extraction unclear
        notes: 'Completing the square of a quadratic expression.',
      },
      {
        id: 'M2.2.5',
        text: 'Solve quadratic equations algebraically.',
        notes: 'Formula and by methods of factorisation and completing the square.',
      },
      {
        id: 'M2.2.6',
        text: 'Solve worded problems.',
        notes:
          'Two simultaneous linear equations, quadratic equations. Applications to other subjects, for example demand and supply functions of business studies.',
      },
      {
        id: 'M2.2.7',
        text: 'Solve a pair of equations in two variables when one equation is quadratic or non-linear and the other linear.',
      },
      {
        id: 'M2.2.8',
        text: 'Represent direct and inverse variation symbolically.',
        notes:
          'y varies directly as x: y is proportional to x, y = kx. y varies inversely as x: y is proportional to 1/x, y = k/x.',
      },
      {
        id: 'M2.2.9',
        text: 'Solve problems involving direct variation and inverse variation.',
      },
    ],
  },
  {
    module: 2,
    code: 'M2-RFG1',
    title: 'Relations, Functions and Graphs 1',
    order: 3,
    // PDF page 38
    objectives: [
      {
        id: 'M2.3.1',
        text: 'Explain basic concepts associated with relations.',
        notes:
          'Concept of a relation, types of relations, examples and non-examples of relations, domain, range, image, co-domain.',
      },
      {
        id: 'M2.3.2',
        text: 'Represent a relation in various ways.',
        notes: 'Set of ordered pairs, arrow diagrams, graphically, algebraically.',
      },
      {
        id: 'M2.3.3',
        text: 'State the characteristics that define a function.',
        notes: 'Concept of a function, examples and non-examples of functions.',
      },
      {
        id: 'M2.3.4',
        text: 'Use functional notation.',
        notes:
          'For example, f: x -> x^2; or f(x) = x^2 as well as y = f(x) for given domains. The inverse function f^-1(x). Composite functions fg = f[g(x)].',
      },
      {
        id: 'M2.3.5',
        text: 'Distinguish between a relation and a function.',
        notes: 'Ordered pairs, arrow diagram, graphically (vertical line test).',
      },
      {
        id: 'M2.3.6',
        text: 'Determine the gradient of a straight line.',
        notes: 'Definition of gradient/slope.',
      },
      {
        id: 'M2.3.7',
        text: 'Determine the equation of a straight line.',
        notes:
          'Using: (a) the graph of the line; (b) the co-ordinates of two points on the line; (c) the gradient and one point on the line; and, (d) one point on the line or its gradient, and its relationship to another line.',
      },
      {
        id: 'M2.3.8',
        text: 'Solve problems involving the gradient of parallel and perpendicular lines.',
      },
      {
        id: 'M2.3.9',
        text: 'Determine from co-ordinates on a line segment: (a) the length; and, (b) the co-ordinates of the midpoint.',
        notes: 'The concept of magnitude or length, concept of midpoint.',
      },
      {
        id: 'M2.3.10',
        text: 'Solve a pair of simultaneous linear equations in two unknowns graphically.',
        notes: 'Intersection of graphs.',
      },
      {
        id: 'M2.3.11',
        text: 'Derive the composition of functions.',
        notes:
          'Composition of no more than two functions, for example, fg, f^2 given f and g. Non-commutativity of composite functions (fg != gf) in general.',
      },
      {
        id: 'M2.3.12',
        text: 'State the relationship between a function and its inverse.',
        notes:
          'The concept of the inverse of a function. The composition of inverse functions f(x) and f^-1(x) is commutative and results in x.',
      },
      {
        id: 'M2.3.13',
        text: 'Derive the inverse of a function.',
        notes: 'f^-1, (fg)^-1.',
      },
      {
        id: 'M2.3.14',
        text: 'Evaluate a function f(x) at a given value of x.',
        notes: 'f(a), f^-1(a), fg(a), where a is a real number.',
      },
      {
        id: 'M2.3.15',
        text: 'Draw the graph of a quadratic function.',
      },
      {
        id: 'M2.3.16',
        text: 'Use the graph of a quadratic function to identify its features.',
        notes:
          '(a) an element of the domain that has a given image; (b) the image of a given element in the domain; (c) the maximum or minimum value of the function; (d) the equation of the axis of symmetry; and, (e) roots of the equation.',
      },
      {
        id: 'M2.3.17',
        text: 'Interpret the graph of a quadratic function.',
        notes:
          '(a) Concepts of gradient of a curve at a point, tangent, turning point. (b) Roots of the function. (c) Interpreting the graph to determine: (i) the interval of the domain for which the elements of the range may be greater than or less than a given number; (ii) an estimate of the value of the gradient at a given point; and, (iii) intercepts of the function.',
      },
      {
        id: 'M2.3.18',
        text: 'Determine the equation of the axis of symmetry and the maximum or minimum value of a quadratic function expressed in the form a(x + h)^2 + k.',
      },
      {
        id: 'M2.3.19',
        text: 'Sketch the graph of a quadratic function expressed in the form y = a(x + h)^2 + k and determine the number of roots.',
      },
      {
        id: 'M2.3.20',
        text: 'Solve problems involving graphs of linear and non-linear functions.',
      },
    ],
  },
  {
    module: 2,
    code: 'M2-GEO1',
    title: 'Geometry and Trigonometry 1',
    order: 4,
    // PDF page 41
    objectives: [
      {
        id: 'M2.4.1',
        text: 'Explain concepts relating to geometry.',
        notes:
          'Points, lines, parallel lines, intersecting lines and perpendicular lines, line segments, rays, curves, planes; types of angles; number of faces, edges and vertices.',
      },
      {
        id: 'M2.4.2',
        text: 'Draw angles and line segments accurately using appropriate instruments.',
      },
      {
        id: 'M2.4.3',
        text: 'Measure angles and line segments accurately using appropriate instruments.',
      },
      {
        id: 'M2.4.4',
        text: 'Construct lines, angles, and polygons using appropriate instruments.',
        notes:
          'Parallel and perpendicular lines. Bisecting line segments and angles. Constructing a line perpendicular to another line, L, from a point that is not on the line, L. Triangles, quadrilaterals, regular and irregular polygons. Angles include 30, 45, 60, 90, 120 degrees and their combinations.',
      },
      {
        id: 'M2.4.5',
        text: 'Identify the type(s) of symmetry possessed by a given plane figure.',
        notes: 'Line(s) of symmetry, rotational symmetry, order of rotational symmetry.',
      },
      {
        id: 'M2.4.6',
        text: 'Solve geometric problems using properties of: (a) lines, angles, and polygons; (b) congruent triangles; (c) similar figures; (d) faces, edges and vertices of solids; and, (e) classes of solids.',
        notes:
          'Determining and justifying the measure of angles: adjacent angles, angles at a point, supplementary angles, complementary angles, vertically opposite angles. Parallel lines and transversals, alternate angles, corresponding angles, co-interior angles. Triangles: equilateral, isosceles, scalene, obtuse, right, acute. Quadrilaterals: square, rectangle, rhombus, kite, parallelogram, trapezium. Other polygons. Cases of congruency. Properties of similar triangles. Prisms, pyramids, cylinders, cones, sphere.',
      },
      {
        id: 'M2.4.7',
        text: "Use Pythagoras' theorem to solve problems.",
      },
      {
        id: 'M2.4.8',
        text: 'Define the trigonometric ratios of acute angles in a right triangle.',
        notes: 'Sine, Cosine, Tangent.',
      },
      {
        id: 'M2.4.9',
        text: 'Relate objects in the physical world to geometric objects.',
        notes: 'Angle of elevation, angle of depression, bearing.',
      },
      {
        id: 'M2.4.10',
        text: 'Apply the trigonometric ratios to solve problems.',
        notes: 'Spatial geometry and scale drawing, angles of elevation and depression.',
      },
    ],
  },
  {
    module: 2,
    code: 'M2-VM1',
    title: 'Vectors and Matrices 1',
    order: 5,
    // PDF page 42
    objectives: [
      {
        id: 'M2.5.1',
        text: 'Explain concepts associated with vectors.',
        notes:
          'Concept of a vector, magnitude, unit vector, direction, scalar. Scalar multiples: parallel vectors, equal vectors, inverse vectors.',
      },
      {
        id: 'M2.5.2',
        text: 'Simplify expressions involving vectors.',
        notes:
          'Vector algebra: addition, subtraction, scalar multiplication. Vector geometry: triangle law, parallelogram law.',
      },
      {
        id: 'M2.5.3',
        text: 'Explain basic concepts associated with matrices.',
        notes: 'Concept of a matrix, row, column, square, identity, rectangular, order.',
      },
      {
        id: 'M2.5.4',
        text: 'Solve problems involving matrix operations.',
        notes:
          'Addition and subtraction of matrices. Scalar multiplication. Multiplication of conformable matrices. Equality, non-commutativity of matrix multiplication.',
      },
      {
        id: 'M2.5.5',
        text: 'Use matrices to solve simple problems in Arithmetic and Algebra.',
        notes: 'Data matrices, equality.',
      },
    ],
  },
];
