// Settlement maths (pure functions, all amounts in pence).
//
// Rules:
// - Attendees (committed + checked in) get their commitment back.
// - No-shows (committed, not checked in) lose their commitment.
// - Each no-show's commitment is split equally between attendees.
//   Pennies that don't divide evenly are handed out one at a time.
// - If nobody checked in, everyone is refunded (there's no one to pay).
// - Anyone excused by TfL was already refunded and sits outside the pot.

export function computeSettlement(event) {
  const ids = Object.keys(event.members)
  const joined = ids.filter((id) => event.members[id].status === 'committed')
  const excused = joined.filter((id) => event.members[id].excused)
  const committed = joined.filter((id) => !event.members[id].excused)
  const attendees = committed.filter((id) => event.members[id].checkedInAt)
  const noShows = committed.filter((id) => !event.members[id].checkedInAt)
  const amount = event.amount
  const payouts = {}
  const transfers = []

  if (attendees.length === 0) {
    committed.forEach((id) => {
      payouts[id] = amount
      transfers.push({ from: 'held', to: id, amount, kind: 'refund' })
    })
    return {
      amount,
      committed,
      excused,
      attendees,
      noShows,
      payouts,
      transfers,
      pot: 0,
      refundedAll: committed.length > 0,
    }
  }

  attendees.forEach((id) => {
    payouts[id] = amount
    transfers.push({ from: 'held', to: id, amount, kind: 'refund' })
  })

  let cursor = 0
  noShows.forEach((noShowId) => {
    const base = Math.floor(amount / attendees.length)
    const remainder = amount % attendees.length
    for (let k = 0; k < attendees.length; k += 1) {
      const attendeeId = attendees[(cursor + k) % attendees.length]
      const share = base + (k < remainder ? 1 : 0)
      if (share > 0) {
        payouts[attendeeId] += share
        transfers.push({ from: noShowId, to: attendeeId, amount: share, kind: 'penalty' })
      }
    }
    cursor = (cursor + remainder) % attendees.length
  })

  return {
    amount,
    committed,
    excused,
    attendees,
    noShows,
    payouts,
    transfers,
    pot: noShows.length * amount,
    refundedAll: false,
  }
}
