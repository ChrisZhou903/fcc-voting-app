import express from 'express'
import Vote from '../models/vote'
import User from '../models/user'

const router = express.Router()

router.get('/', (req, res) => {
  User.find({}, (err, users) => {
    if (err) {
      return res.status(400).send({
        error: err.message,
      })
    }

    return Vote.find(
      {},
      {},
      {
        sort: {
          date: -1,
        },
      },
      (voteErr, votes) => {
        if (voteErr) {
          return res.status(400).send({
            error: voteErr.message,
          })
        }

        return res.json(
          votes.map(vote => {
            const { owner, ...rest } = vote.toObject()
            const ownerUser = users.find(user => user.id === owner.id)
            const ownerName = ownerUser && ownerUser.displayName

            if (ownerName) {
              owner.name = ownerName
            }

            return {
              ...rest,
              owner,
              isOwner: req.user && (vote.owner.id === req.user.id),
            }
          }),
        )
      })
  })
})

router.post('/new', (req, res) => {
  const { options, ...rest } = req.body

  if (!req.user) {
    res.status(401).send({
      error: 'NotSignIn',
    })
  }

  const newVote = new Vote({
    options: options.map(({ text }) => ({
      text,
    })),
    owner: {
      id: req.user.id,
    },
    ...rest,
  })

  newVote.save((err, vote) => {
    if (err) {
      return res.status(400).send({
        error: err.message,
      })
    }
    return res.json(vote)
  })
})

router.put('/:id', (req, res) => {
  const voteId = req.params.id
  const { options, ...rest } = req.body

  Vote.findOneAndUpdate(
    { _id: voteId },
    {
      $set: {
        ...rest,
        date: Date.now(),
      },
    },
    { new: true }, // return the doc after updates in callback
    (err, vote) => {
      if (err) {
        return res.status(400).send({
          error: err.message,
        })
      }

      if (!vote) {
        return res.status(400).send({
          error: 'VoteNotExists',
        })
      }

      // remove options which are not in req.body
      vote.options.forEach(({ id }) => {
        const isNotInReq = options.every(({ id: optionId }) => id !== optionId)

        if (isNotInReq) {
          vote.options.id(id).remove()
        }
      })

      // update/add options if exists/new
      options.forEach(({ id: optionId, text }) => {
        const option = vote.options.id(optionId)

        if (option) {
          option.text = text
        } else {
          vote.options.push({
            text,
          })
        }
      })

      return vote.save((saveErr, saveVote) => {
        if (saveErr) {
          return res.status(400).send({
            error: err.message,
          })
        }

        return res.json(saveVote)
      })
    },
  )
})

router.get('/:id', (req, res) => {
  const voteId = req.params.id
  const user = req.user

  Vote.findOne({ _id: voteId }, (err, vote) => {
    if (err) {
      return res.status(400).send({
        error: err.message,
      })
    }

    if (!vote) {
      return res.status(400).send({
        error: 'VoteNotExists',
      })
    }

    return res.json({
      ...vote.toObject(),
      isOwner: user && (vote.owner.id === user.id),
    })
  })
})

router.put('/:id/options', (req, res) => {
  const voteId = req.params.id
  const { options } = req.body
  const user = req.user

  Vote.findById(
    { _id: voteId },
    (err, vote) => {
      if (err) {
        return res.status(400).send({
          error: err.message,
        })
      }

      if (!vote) {
        return res.status(400).send({
          error: 'VoteNotExists',
        })
      }

      if (typeof options === 'string') {
        // options is a string when radio
        const option = vote.options.id(options)

        option.number += 1
      } else {
        // options is an array when checkbox
        options.forEach(optionId => {
          const option = vote.options.id(optionId)

          if (option) {
            option.number += 1
          }
        })
      }

      return vote.save((saveErr, saveVote) => {
        if (saveErr) {
          return res.status(400).send({
            error: err.message,
          })
        }

        return res.json({
          ...saveVote.toObject(),
          isOwner: user && (saveVote.owner.id === user.id),
        })
      })
    },
  )
})

router.delete('/:id', (req, res) => {
  const voteId = req.params.id

  Vote.findOneAndRemove({ _id: voteId }, (err, vote) => {
    if (err) {
      return res.status(400).send({
        error: err.message,
      })
    }

    if (!vote) {
      return res.status(400).send({
        error: 'VoteNotExists',
      })
    }

    return res.json({
      success: `The "${vote.title}" vote has been removed`,
    })
  })
})

export default router
