import type { SeedTopic } from './types';

// Transcribed from design/syllabus-2027.pdf, Module 1 (PDF pages ~20-35).
// Objective ids follow syllabus numbering: 'M1.<topic>.<objective>'.
export const module1Topics: SeedTopic[] = [
  {
    module: 1,
    code: 'M1-NTC',
    title: 'Number Theory and Computation',
    order: 1,
    // PDF page 21
    objectives: [
      {
        id: 'M1.1.1',
        text: 'Distinguish among sets of numbers.',
        notes:
          'Sets of numbers: natural numbers N = {1, 2, 3, ...}; whole numbers W = {0, 1, 2, 3, ...}; integers Z = {..., -2, -1, 0, 1, 2, ...}; rational numbers Q = {p/q : p and q are integers, q != 0}; irrational numbers (numbers that cannot be expressed as terminating or recurring decimals, for example pi and sqrt(2)); real numbers R = the union of rational and irrational numbers; inclusion relations, for example N is a subset of W, W of Z, Z of Q, Q of R. Sequences of numbers that have a recognisable pattern; factors and multiples; square numbers; even numbers; odd numbers; prime numbers; composite numbers.',
      },
      {
        id: 'M1.1.2',
        text: 'Compute powers of real numbers of the form x^a, where a is rational.',
        notes: 'Including squares, square roots, cubes, cube roots.',
      },
      {
        id: 'M1.1.3',
        text: 'Evaluate numerical expressions using any of the four basic operations on real numbers.',
        notes:
          'Addition, multiplication, subtraction and division of whole numbers, fractions and decimals; order of operations.',
      },
      {
        id: 'M1.1.4',
        text: 'Convert among fractions, percents and decimals.',
        notes:
          'Conversion of fractions to decimals and percentages, conversion of decimals to fractions and percentages, conversion of percentages to decimals and fractions.',
      },
      {
        id: 'M1.1.5',
        text: 'List the set of factors and multiples of a given integer.',
        notes: 'Positive and negative factors of integers.',
      },
      {
        id: 'M1.1.6',
        text: 'Compute the H.C.F. or L.C.M. of two or more positive integers.',
        notes: 'Highest common factors and lowest common multiples.',
      },
      {
        id: 'M1.1.7',
        text: 'State the value of a digit of a numeral in a given base.',
        notes: 'Place value and face value of numbers in bases 2, 4, 8, and 10.',
      },
      {
        id: 'M1.1.8',
        text: 'Convert from one set of units to another.',
        notes:
          'Conversion using conversion scales, converting within the metric scales, 12-hour and 24-hour clock.',
      },
      {
        id: 'M1.1.9',
        text: 'Express a value to a given number of: (a) significant figures; and, (b) decimal places.',
        notes: '1, 2 or 3 significant figures; 0, 1, 2 or 3 decimal places.',
      },
      {
        id: 'M1.1.10',
        text: 'Use properties of numbers and operations in computational tasks.',
        notes:
          'Properties of operations such as closure, associativity, additive and multiplicative identities and inverses, commutativity and distributivity.',
      },
      {
        id: 'M1.1.11',
        text: 'Calculate any fraction or percentage of a given quantity.',
        notes:
          'Fractions and percentages of a whole. The whole given a fraction or percentage.',
      },
      {
        id: 'M1.1.12',
        text: 'Write any rational number in scientific notation.',
        notes:
          'Scientific notation. For example, (a) 759000 = 7.59 x 10^5; (b) 0.00759 = 7.59 x 10^-3.',
      },
      {
        id: 'M1.1.13',
        text: 'Express one quantity as a fraction or percentage of another.',
        notes: 'Comparing two quantities using fractions and percentages.',
      },
      {
        id: 'M1.1.14',
        text: 'Compare quantities.',
        notes: 'Ratio, proportion and rates.',
      },
      {
        id: 'M1.1.15',
        text: 'Order a set of real numbers.',
        notes:
          'Rearranging a set of real numbers in ascending or descending order. For example, 1.1, 7/2, sqrt(2), 1.45, pi in ascending order is 1.1, sqrt(2), 1.45, pi, 7/2.',
      },
      {
        id: 'M1.1.16',
        text: 'Compute terms of a sequence given a rule.',
      },
      {
        id: 'M1.1.17',
        text: 'Derive an appropriate rule given the terms of a sequence.',
      },
      {
        id: 'M1.1.18',
        text: 'Divide a quantity in a given ratio.',
        notes: 'Ratio, proportion of no more than three parts.',
      },
      {
        id: 'M1.1.19',
        text: 'Solve problems involving concepts in number theory and computation.',
        notes: 'Including ratio, rates and proportion.',
      },
    ],
  },
  {
    module: 1,
    code: 'M1-CONS',
    title: 'Consumer Arithmetic',
    order: 2,
    // PDF page 24
    objectives: [
      {
        id: 'M1.2.1',
        text: 'Calculate: (a) discount; (b) sales tax; (c) profit; and, (d) loss.',
      },
      {
        id: 'M1.2.2',
        text: 'Calculate: (a) percentage profit; and, (b) percentage loss.',
      },
      {
        id: 'M1.2.3',
        text: 'Express a profit, loss, discount, markup and purchase tax, as a percentage of some value.',
      },
      {
        id: 'M1.2.4',
        text: 'Solve problems involving marked price, selling price, cost price, profit, loss or discount.',
      },
      {
        id: 'M1.2.5',
        text: 'Solve problems involving payments by instalments as in the case of hire purchase and mortgages.',
      },
      {
        id: 'M1.2.6',
        text: 'Solve problems involving simple interest.',
        notes: 'Principal, time, rate, amount.',
      },
      {
        id: 'M1.2.7',
        text: 'Solve problems involving compound interest.',
        notes:
          'Formulae may be used in computing compound interest. The use of calculators is encouraged.',
      },
      {
        id: 'M1.2.8',
        text: 'Solve problems involving appreciation and depreciation.',
      },
      {
        id: 'M1.2.9',
        text: 'Solve problems involving measures and money.',
        notes: 'Currency conversion.',
      },
      {
        id: 'M1.2.10',
        text: 'Solve problems involving: (a) rates and taxes; (b) utilities; (c) invoices and shopping bills; (d) salaries and wages; and, (e) insurance and investments.',
      },
    ],
  },
  {
    module: 1,
    code: 'M1-SETS',
    title: 'Sets',
    order: 3,
    // PDF page 25
    objectives: [
      {
        id: 'M1.3.1',
        text: 'Explain concepts relating to sets.',
        notes:
          'Examples and non-examples of sets, description of sets using words, membership of a set, cardinality of a set, finite and infinite sets, universal set, empty set, complement of a set, subsets.',
      },
      {
        id: 'M1.3.2',
        text: 'Represent a set in various forms.',
        notes:
          'Representation of a set. For example, (a) Description: the set A comprising the first three natural numbers; (b) Set builder notation: A = {x : 0 < x < 4, x is a natural number}; (c) Listing: A = {1, 2, 3}.',
      },
      {
        id: 'M1.3.3',
        text: 'List subsets of a given set.',
        notes:
          'Identifying the subsets as well as determining the number of subsets of a set with n elements.',
      },
      {
        id: 'M1.3.4',
        text: 'Determine elements in intersections, unions and complements of sets.',
        notes:
          'Intersection and union of not more than three sets. Apply the result n(A union B) = n(A) + n(B) - n(A intersect B).',
      },
      {
        id: 'M1.3.5',
        text: 'Describe relationships among sets using set notation and symbols.',
        notes:
          'Universal, complement, subsets, equal and equivalent sets, intersection, disjoint sets and union of sets.',
      },
      {
        id: 'M1.3.6',
        text: 'Draw Venn diagrams to represent relationships among sets.',
        notes: 'Not more than 4 sets including the universal set.',
        assessable: false as const,
        unassessable_reason: 'Requires drawing a Venn diagram by hand.',
      },
      {
        id: 'M1.3.7',
        text: 'Use Venn diagrams to represent the relationships among sets.',
      },
      {
        id: 'M1.3.8',
        text: 'Solve problems in Number Theory, Algebra and Geometry using concepts in set theory.',
      },
    ],
  },
  {
    module: 1,
    code: 'M1-MEAS',
    title: 'Measurement',
    order: 4,
    // PDF page 26
    objectives: [
      {
        id: 'M1.4.1',
        text: 'Convert units of length, mass, area, volume, capacity.',
        notes: 'Refer to Module 1, SO 1.8.',
      },
      {
        id: 'M1.4.2',
        text: 'Use the appropriate SI unit of measure for area, volume, capacity, mass, temperature and time (24-hour clock) and other derived quantities.',
        notes: 'Refer to Module 1, SO 1.8.',
      },
      {
        id: 'M1.4.3',
        text: 'Determine the perimeter of a plane shape.',
        notes:
          'Estimating and measuring the perimeter of compound and irregular shapes. Calculating the perimeter of polygons and circles.',
      },
      {
        id: 'M1.4.4',
        text: 'Calculate the length of an arc of a circle.',
        notes: 'Perimeter of sector of a circle.',
      },
      {
        id: 'M1.4.5',
        text: 'Estimate the area of plane shapes.',
        notes: 'Finding the area of plane shapes without using formulae.',
      },
      {
        id: 'M1.4.6',
        text: 'Calculate the area of polygons and circles.',
      },
      {
        id: 'M1.4.7',
        text: 'Calculate the area of a sector of a circle.',
      },
      {
        id: 'M1.4.8',
        text: 'Calculate the surface area of solids.',
        partial_reason: 'We set the solids we can draw and describe the rest in words; a prism with a sector cross-section needs paper.',
        notes:
          'Prisms including cubes and cylinders; right pyramids including cones; spheres. Surface area of sphere, A = 4*pi*r^2. Drawing limit (R1.6 §6): we can only draw a cuboid, a cylinder and a triangular prism, so set solids we can show or describe the solid fully in words — never a prism with a sector cross-section drawn in perspective.',
      },
      {
        id: 'M1.4.9',
        text: 'Calculate the volume of solids.',
        partial_reason: 'We set the solids we can draw and describe the rest in words; a prism with a sector cross-section needs paper.',
        notes:
          'Prism including cube and cuboid, cylinder, right pyramid, cone and sphere. Volume of sphere, V = (4/3)*pi*r^3. Drawing limit (R1.6 §6): we can only draw a cuboid, a cylinder and a triangular prism, so set solids we can show or describe the solid fully in words — never a prism with a sector cross-section drawn in perspective.',
      },
      {
        id: 'M1.4.10',
        text: 'Solve problems involving the relations among time, distance and speed.',
        notes: 'Average speed.',
      },
      {
        id: 'M1.4.11',
        text: 'Estimate the margin of error for a given measurement.',
        notes: 'Sources of error. Maximum and minimum measurements.',
      },
      {
        id: 'M1.4.12',
        text: 'Use scales and scale drawings to determine distances and areas.',
        notes: 'Link to Geography, associate with map drawing and map reading.',
      },
      {
        id: 'M1.4.13',
        text: 'Solve problems involving measurement.',
        notes: 'Perimeter, area and volume of compound shapes and solids.',
      },
    ],
  },
  {
    module: 1,
    code: 'M1-ALG1',
    title: 'Algebra 1',
    order: 5,
    // PDF page 27
    objectives: [
      {
        id: 'M1.5.1',
        text: 'Use symbols to represent numbers, operations, variables and relations.',
        notes: 'Symbolic representation.',
      },
      {
        id: 'M1.5.2',
        text: 'Translate between algebraic symbols and worded expressions.',
      },
      {
        id: 'M1.5.3',
        text: 'Evaluate arithmetic operations involving directed numbers.',
      },
      {
        id: 'M1.5.4',
        text: 'Simplify algebraic expressions using the four basic operations.',
      },
      {
        id: 'M1.5.5',
        text: 'Evaluate expressions involving binary operations (other than the four basic operations).',
        notes: 'Commutative, associative and distributive properties.',
      },
      {
        id: 'M1.5.6',
        text: 'Substitute numbers for variables in algebraic expressions.',
      },
      {
        id: 'M1.5.7',
        text: 'Apply the distributive law to factorise or expand algebraic expressions.',
        notes:
          'For example, x(a + b) = ax + bx; (a + b)(x + y) = ax + bx + ay + by.',
      },
      {
        id: 'M1.5.8',
        text: 'Simplify algebraic fractions.',
        notes: 'The four basic operations on algebraic fractions.',
      },
      {
        id: 'M1.5.9',
        text: 'Use the laws of indices to manipulate expressions with integral indices.',
        notes:
          'For m, n integers: (i) x^m * x^n = x^(m+n); (ii) x^m / x^n = x^(m-n); (iii) (x^m)^n = x^(mn); (iv) x^-m = 1/x^m.',
      },
      {
        id: 'M1.5.10',
        text: 'Solve linear equations in one unknown.',
      },
      {
        id: 'M1.5.11',
        text: 'Solve a simple linear inequality in one unknown.',
        notes: 'Represent solutions using set builder notation.',
      },
      {
        id: 'M1.5.12',
        text: 'Change the subject of formulae.',
        notes: 'Equations of the type to include: y = mx + c; C = 2*pi*r; P = c/(2x).', // extraction unclear
      },
      {
        id: 'M1.5.13',
        text: 'Factorise simple algebraic expressions.',
        notes: 'Expressions of the type to include: ax + bx; ax^2 + b.',
      },
      {
        id: 'M1.5.14',
        text: 'Solve worded problems.',
        notes: 'Linear equations and linear inequalities.',
      },
      {
        id: 'M1.5.15',
        text: 'Prove two algebraic expressions to be identical.',
        notes: 'Equations versus identities.',
      },
    ],
  },
  {
    module: 1,
    code: 'M1-GRAPHS',
    title: 'Introduction to Graphs',
    order: 6,
    // PDF page 29
    objectives: [
      {
        id: 'M1.6.1',
        text: 'Draw graphs of linear functions.',
        notes:
          'Concept of linear function, types of linear function (y = c; x = k; y = mx + c; where m, c and k are real numbers). For example, y = 0 (x-axis); x = 0 (y-axis).',
        partial_reason: 'We set the plotting on graph paper; photograph what you drew and we mark the drawing, otherwise you check it against the finished graph yourself.',
        photo_assessable: true as const,
      },
      {
        id: 'M1.6.2',
        text: 'Determine the intercepts of the graph of linear functions.',
        notes: 'x-intercepts and y-intercepts, graphically and algebraically.',
      },
      {
        id: 'M1.6.3',
        text: 'Solve problems involving graphs of linear functions.',
      },
    ],
  },
];
