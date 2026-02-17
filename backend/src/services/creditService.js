// services/creditService.js
import { DepartmentCredit } from '../models/index.js';

//  Helpers
export function currentMonthYear() {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear()
  };
}

export const getOrCreateCredit = async (departmentId, transaction) => {
  const { month, year } = currentMonthYear();

  let credit = await DepartmentCredit.findOne({
    where: { departmentId, month, year },
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined
  });

  if (!credit) {
    credit = await DepartmentCredit.create(
      {
        departmentId,
        month,
        year,
        availableCredits: 100,
        lockedCredits: 0
      },
      { transaction }
    );
  }

  return credit;
}

// Used when booking needs approval (PENDING)

export const lockCredits = async (departmentId, amount, transaction) => {
  const credit = await getOrCreateCredit(departmentId, transaction);

  if (credit.availableCredits < amount) {
    throw new Error(
      `Insufficient credits. Required ${amount}, available ${credit.availableCredits}`
    );
  }

  credit.availableCredits -= amount;
  credit.lockedCredits += amount;

  await credit.save({ transaction });
}

// Used when PENDING booking is APPROVED

export const deductLockedCredits = async (departmentId, amount, transaction) => {
  const credit = await getOrCreateCredit(departmentId, transaction);

  if (credit.lockedCredits < amount) {
    throw new Error('Locked credit mismatch');
  }

  credit.lockedCredits -= amount;
  await credit.save({ transaction });
}

// Used when booking does NOT require approval

export const deductCredits = async (departmentId, amount, transaction) => {
  const credit = await getOrCreateCredit(departmentId, transaction);

  if (credit.availableCredits < amount) {
    throw new Error('Insufficient credits');
  }

  credit.availableCredits -= amount;
  await credit.save({ transaction });
}

//  Used when PENDING booking is REJECTED

export const releaseLockedCredits = async (departmentId, amount, transaction) => {
  const credit = await getOrCreateCredit(departmentId, transaction);

  if (credit.lockedCredits < amount) {
    throw new Error('Locked credit mismatch');
  }

  credit.lockedCredits -= amount;
  credit.availableCredits += amount;

  await credit.save({ transaction });
}

// Used for cancellation refunds

export const refundCredits = async (departmentId, amount, transaction) => {
  const credit = await getOrCreateCredit(departmentId, transaction);

  credit.availableCredits += amount;
  await credit.save({ transaction });
}

//  Used for monthly credit reset

export const resetMonthlyCredits = async (departmentId, transaction) => {
  const { month, year } = currentMonthYear();

  const credit = await DepartmentCredit.findOne({
    where: { departmentId, month, year },
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined
  });

  if (!credit) {
    return await DepartmentCredit.create(
      {
        departmentId,
        month,
        year,
        availableCredits: 100,
        lockedCredits: 0
      },
      { transaction }
    );
  }

  credit.availableCredits = 100;
  credit.lockedCredits = 0;

  await credit.save({ transaction });
  return credit;
};
