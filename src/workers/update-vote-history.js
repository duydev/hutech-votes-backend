const { Candidate, VoteHistory } = require('../db');
const {
  getCandidateVotesById,
  getAllCandidatesVotes,
  sleep
} = require('../utils');

async function main() {
  try {
    const allVotes = await getAllCandidatesVotes();

    const candidates = await Candidate.findAll({
      attributes: ['id']
    });

    for (let i = 0; i < candidates.length; i++) {
      const { id } = candidates[i];

      let votes = allVotes[id] || 0;

      if (votes < 1 && true) {
        votes = await getCandidateVotesById(id);
      }

      console.log('\n', id, votes, '\n');

      await Candidate.update({ votes }, { where: { id } });
      await VoteHistory.create({ candidateId: id, votes });

      sleep('1000');
    }

    console.log('DONE');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
