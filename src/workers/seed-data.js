const { Category, Candidate, VoteHistory } = require('../db');
const { getCategoriesAndCandidates, getCandidateById } = require('../utils');

async function main() {
  try {
    const { categories, candidates } = await getCategoriesAndCandidates();

    await VoteHistory.truncate({ cascade: true });
    await Candidate.truncate({ cascade: true });
    await Category.truncate({ cascade: true });

    await Category.bulkCreate(categories);
    await Candidate.bulkCreate(candidates);
    await VoteHistory.bulkCreate(
      candidates.map(({ id, votes }) => ({
        candidateId: id,
        votes
      }))
    );

    const ids = candidates.map(({ id }) => id);

    for (let i = 0; i < ids.length; i++) {
      const { description } = await getCandidateById(ids[i]);

      await Candidate.update(
        {
          description
        },
        {
          where: {
            id: ids[i]
          }
        }
      );
    }

    console.log('DONE');

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
