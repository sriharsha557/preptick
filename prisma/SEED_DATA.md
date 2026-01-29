# Seed Data Documentation

This document describes the syllabus topic seed data for the MockPrep platform.

## Overview

The seed data includes syllabus topics for both CBSE and Cambridge curricula, covering grades 1-10 with multiple subjects.

## Data Structure

### Curricula
- **CBSE** (Central Board of Secondary Education - India)
- **Cambridge** (Cambridge International Examinations)

### Grades Covered
- Grade 1 (Primary)
- Grade 5 (Upper Primary)
- Grade 10 (Secondary)

### Subjects
- **Mathematics**: Core mathematical concepts and problem-solving
- **Science**: Biology, Chemistry, Physics concepts
- **English**: Reading, writing, grammar, and literature

## Seed Data Summary

### CBSE Topics (21 topics)
- **Grade 1 Mathematics**: 3 topics
  - Numbers up to 100
  - Addition and Subtraction
  - Shapes and Patterns

- **Grade 5 Mathematics**: 5 topics (including 1 hierarchical)
  - Numbers (parent topic)
    - Place Value (child topic)
  - Fractions
  - Geometry
  - Decimals

- **Grade 5 Science**: 3 topics
  - Living and Non-living Things
  - Plants
  - Animals

- **Grade 5 English**: 2 topics
  - Reading Comprehension
  - Grammar

- **Grade 10 Mathematics**: 4 topics
  - Real Numbers
  - Polynomials
  - Quadratic Equations
  - Trigonometry

- **Grade 10 Science**: 3 topics
  - Chemical Reactions
  - Life Processes
  - Electricity

- **Grade 10 English**: 1 topic
  - Literature

### Cambridge Topics (18 topics)
- **Grade 1 Mathematics**: 2 topics
  - Number
  - Geometry

- **Grade 5 Mathematics**: 4 topics
  - Number
  - Fractions and Decimals
  - Measurement
  - Geometry

- **Grade 5 Science**: 3 topics
  - Living Things
  - Forces and Motion
  - Materials

- **Grade 5 English**: 2 topics
  - Reading
  - Writing

- **Grade 10 Mathematics**: 3 topics
  - Algebra
  - Functions
  - Geometry and Trigonometry

- **Grade 10 Science**: 3 topics
  - Biology - Cells
  - Chemistry - Atoms and Elements
  - Physics - Forces and Motion

- **Grade 10 English**: 1 topic
  - Literature

## Hierarchical Structure

The seed data includes an example of hierarchical topic organization:
- **CBSE Grade 5 Mathematics**
  - Numbers (parent)
    - Place Value (child)

This demonstrates the parent-child relationship capability in the data model.

## Topic Data Fields

Each topic includes:
- **curriculum**: CBSE or Cambridge
- **grade**: 1-10
- **subject**: Mathematics, Science, or English
- **topicName**: Descriptive name of the topic
- **syllabusSection**: Official curriculum section reference
- **officialContent**: Description of the topic content
- **learningObjectives**: Array of specific learning goals
- **parentTopicId**: Optional reference to parent topic (for hierarchical structure)

## Running the Seed Script

To populate the database with seed data:

```bash
npm run db:seed
```

This will:
1. Clear existing syllabus topics
2. Create all CBSE topics
3. Create all Cambridge topics
4. Establish parent-child relationships
5. Display a summary of created data

## Extending the Seed Data

To add more topics:

1. Edit `prisma/seed.ts`
2. Add new topic objects to the `cbseTopics` or `cambridgeTopics` arrays
3. For hierarchical topics, set the `parentTopicName` field
4. Run `npm run db:seed` to update the database

## Validation

The seed data has been validated to ensure:
- All topics have required fields
- Hierarchical relationships are correctly established
- Topics are properly distributed across curricula, grades, and subjects
- Learning objectives are properly formatted as JSON arrays

## Testing

The syllabus service includes comprehensive tests that verify:
- Topic retrieval by curriculum, grade, and subject
- Topic validation for test generation
- Hierarchical structure integrity
- Subject listing functionality

Run tests with:
```bash
npm test -- src/services/syllabus.test.ts
```
