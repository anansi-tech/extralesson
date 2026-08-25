import type { SeedTopic } from './types';

// Transcribed from design/syllabus-2027.pdf, Module 3 (PDF pages ~47–56).
// Objective ids follow syllabus numbering: 'M3.<topic>.<objective>'.
export const module3Topics: SeedTopic[] = [
  {
    module: 3,
    code: 'M3-STAT2',
    title: 'Statistics 2',
    order: 1,
    // PDF page 48
    objectives: [
      {
        id: 'M3.1.1',
        text: 'Construct a frequency table for a given set of data.',
        notes: 'Discrete and continuous variables. Grouped data.',
      },
      {
        id: 'M3.1.2',
        text: 'Determine class features for a given set of data.',
        notes: 'Class interval, class boundaries, class limits, class midpoint, class width.',
      },
      {
        id: 'M3.1.3',
        text: 'Construct statistical diagrams.',
        notes: 'Line graphs, histograms with bars of equal width and frequency polygons.',
        assessable: false as const,
        unassessable_reason: 'Requires drawing a statistical diagram by hand.',
      },
      {
        id: 'M3.1.4',
        text: 'Determine measures of central tendency for raw grouped data.',
        notes: 'Grouped data: modal class, median class and the estimate of the mean.',
      },
      {
        id: 'M3.1.5',
        text: 'Determine the measures of dispersion (spread) for grouped data.',
        notes: 'Estimating range, interquartile range and semi-interquartile range.',
      },
      {
        id: 'M3.1.6',
        text: 'Use standard deviation to compare sets of data.',
        notes: 'No calculation of the standard deviation will be required.',
      },
      {
        id: 'M3.1.7',
        text: 'Draw cumulative frequency curve (Ogive).',
        notes: 'Appropriate scales for axes. Class boundaries as domain.',
        assessable: false as const,
        unassessable_reason: 'Requires drawing a cumulative frequency curve on a supplied grid.',
        photo_assessable: true as const,
      },
      {
        id: 'M3.1.8',
        text: 'Analyse statistical diagrams.',
        notes: 'Finding the mean, mode, median, range, quartiles, interquartile range, semi-interquartile range; trends and patterns.',
      },
      {
        id: 'M3.1.9',
        text: 'Determine the proportion or percentage of the sample above or below a given value from raw grouped data, frequency table or cumulative frequency curve.',
      },
      {
        id: 'M3.1.10',
        text: 'Determine experimental and theoretical probabilities of simple events.',
        notes: 'The use of contingency tables. Addition for exclusive events; multiplication for independent events.',
      },
      {
        id: 'M3.1.11',
        text: 'Make inference(s) from statistics.',
        notes: 'Raw data, tables, diagrams, summary statistics.',
      },
    ],
  },
  {
    module: 3,
    code: 'M3-RFG2',
    title: 'Relations, Functions and Graphs 2',
    order: 2,
    // PDF page 49
    objectives: [
      {
        id: 'M3.2.1',
        text: 'Draw a graph to represent a linear inequality in two variables.',
        partial_reason: 'We supply the shaded grid and assess reading it; photograph your shading and we mark the boundary too.',
        photo_assessable: true as const,
      },
      {
        id: 'M3.2.2',
        text: 'Represent the solution of linear inequalities in one variable using (a) number line; and (b) graphs.',
      },
      {
        id: 'M3.2.3',
        text: 'Use linear programming techniques to graphically solve problems involving two variables.',
      },
      {
        id: 'M3.2.4',
        text: 'Draw graphs of non-linear functions.',
        notes: 'y = ax^n where n = -1, -2 and +3 and a is a constant. Distance-time and speed-time.',
        assessable: false as const,
        unassessable_reason: 'Requires drawing a graph on a supplied grid.',
        photo_assessable: true as const,
      },
      {
        id: 'M3.2.5',
        text: 'Interpret graphs of functions.',
        notes: 'Including distance-time graphs and speed-time graphs.',
      },
      {
        id: 'M3.2.6',
        text: 'Solve problems involving graphs of linear and non-linear functions.',
        notes: 'Including a combination of linear and non-linear functions.',
      },
    ],
  },
  {
    module: 3,
    code: 'M3-GEO2',
    title: 'Geometry and Trigonometry 2',
    order: 3,
    // PDF page 49
    objectives: [
      {
        id: 'M3.3.1',
        text: 'Solve geometric problems using properties of circles and circle theorems.',
        notes: 'Radius, diameter, chord, circumference, arc, tangent, segment, sector, semicircle, pi. Determining and justifying angles using the circle theorems: the angle which an arc subtends at the centre is twice the angle it subtends at any point on the remaining part of the circumference; angles at the circumference in the same segment subtended by the same arc/chord are equal; the angle at the circumference subtended by the diameter is a right angle; the opposite angles of a cyclic quadrilateral are supplementary; the exterior angle of a cyclic quadrilateral is equal to the interior opposite angle; the angle between a tangent and a chord through the point of contact equals the angle in the alternate segment; a tangent is perpendicular to the radius/diameter at the point of contact; the lengths of two tangents from an external point to the points of contact are equal; the line joining the centre to the midpoint of a chord is perpendicular to the chord.',
      },
      {
        id: 'M3.3.2',
        text: 'Represent translations in a plane using vectors.',
        notes: 'Column matrix notation.',
      },
      {
        id: 'M3.3.3',
        text: 'Determine and represent the location of: (a) the image of an object under a transformation; and (b) an object given the image under a transformation.',
        notes: 'Translation in the plane. Reflection in a line in that plane. Rotation about a point (the centre of rotation) in that plane. Enlargement in the plane.',
      },
      {
        id: 'M3.3.4',
        text: 'State the relationship between an object and its image in the plane under geometric transformations.',
        notes: 'Orientation, similarity, congruency.',
      },
      {
        id: 'M3.3.5',
        text: 'Describe a transformation given an object and its image.',
        notes: 'Translation: vector notation. Reflection: mirror line/axis of symmetry. Rotation: centre of rotation, angle of rotation, direction of rotation. Enlargement: centre, scale factor k such that |k| > 1 or 0 < |k| < 1.',
      },
      {
        id: 'M3.3.6',
        text: 'Locate the image of an object under a combination of transformations.',
        notes: 'Combination of any two of: (a) enlargement; (b) translation; (c) rotation; and (d) reflection.',
      },
      {
        id: 'M3.3.7',
        text: 'Use the sine and cosine rules to solve problems involving triangles.',
      },
      {
        id: 'M3.3.8',
        text: 'Calculate the area of a triangle given two sides and the angle they form.',
        notes: 'Use of formulae. Including given two sides and included angle.',
      },
      {
        id: 'M3.3.9',
        text: 'Calculate the area of a segment of a circle.',
      },
      {
        id: 'M3.3.10',
        text: 'Solve problems involving bearings.',
        notes: 'Relative position of two points given the bearing of one point with respect to the other; bearing of one point relative to another point given the position of the points. Bearing written in 3-digit format, for example 060 degrees.',
      },
    ],
  },
  {
    module: 3,
    code: 'M3-VM2',
    title: 'Vectors and Matrices 2',
    order: 4,
    // PDF page 51
    objectives: [
      {
        id: 'M3.4.1',
        text: 'Write the position vector of a point P(a, b) as OP = (a b) as a column vector, where O is the origin (0, 0).',
        notes: 'Displacement and position vectors; including the use of coordinates in the x-y plane to identify and determine displacement and position vectors.',
      },
      {
        id: 'M3.4.2',
        text: 'Determine the magnitude of a vector.',
        notes: 'Including unit vectors.',
      },
      {
        id: 'M3.4.3',
        text: 'Determine the direction of a vector.',
      },
      {
        id: 'M3.4.4',
        text: 'Use vectors to solve problems in geometry.',
        notes: 'Points in a straight line, parallel lines; displacement, velocity, weight.',
      },
      {
        id: 'M3.4.5',
        text: "Evaluate the determinant of a '2 x 2' matrix.",
      },
      {
        id: 'M3.4.6',
        text: 'Define the multiplicative inverse of a non-singular square matrix.',
        notes: 'Identity for the square matrices.',
      },
      {
        id: 'M3.4.7',
        text: "Obtain the inverse of a non-singular '2 x 2' matrix.",
        notes: 'Determinant and adjoint of a matrix.',
      },
      {
        id: 'M3.4.8',
        text: "Determine a '2 x 2' matrix associated with a specified transformation.",
        notes: 'Transformation which is equivalent to the composition of two linear transformations in a plane (where the origin remains fixed). (a) Reflection in: the x-axis, y-axis, the lines y = x and y = -x. (b) Rotation in a clockwise and anticlockwise direction about the origin; the general rotation matrix. (c) Enlargement with centre at the origin.',
      },
      {
        id: 'M3.4.9',
        text: 'Use matrices to solve simple problems in Arithmetic, Algebra and Geometry.',
        notes: 'Data matrices, equality. Use of matrices to solve linear simultaneous equations with two unknowns. Problems involving determinants are restricted to 2x2 matrices. Matrices of order greater than m x n will not be set, where m <= 4, n <= 4.',
      },
    ],
  },
];
