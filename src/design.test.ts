import { describe, expect, it } from 'vitest'
import {
  parseBepFileName,
  parseYyMmDdFolder,
  roleInCodes,
  assignRevisionNumbers,
  compareHstkToPackages,
  pickPrimaryModelTask,
  modelMatrixAssigneeFromTasks,
  primaryTaskCvReportFields,
  modelMatrixCvFromTasks,
  modelMatrixRevisionUpdatedFromTasks,
  buildHstkReference,
  displayRevision,
  revisionCountForDiscipline,
  validateDesignFolderPath,
  normalizeNasPath,
  mergeScanFolderNames,
  pickLatestPresentPackage,
  parsePackageFromFolderPath,
  pickLatestPackageForDiscipline,
  pickDisciplineHeadlinePackage,
  dashboardTimelinePackages,
  dashboardPackageMissingNasBlockers,
  designStoredPathsEqual,
  taskEligibleForCategoryPackageNotify,
  formatLatestPackageHeadline,
  buildCategoryDossierStatus,
  resolveEmptyTaskDescription,
  collectProjectLeaderUserIds,
  collectDesignPackageNotifyRecipientUserIds,
} from './design'

describe('parseBepFileName', () => {
  it('parses standard BEP model name', () => {
    const r = parseBepFileName('TT09-OAD-HZ-BF-M3-A-0001-HAM TT.rvt')
    expect('error' in r).toBe(false)
    if ('error' in r) return
    expect(r.volume).toBe('HZ')
    expect(r.type).toBe('M3')
    expect(r.role).toBe('A')
    expect(r.number).toBe('0001')
    expect(r.description).toBe('HAM TT')
  })

  it('rejects BOD-style invalid name', () => {
    const r = parseBepFileName('BOD-TKCS-ZZ-M3-Nhà làm việc chính-Combine')
    expect('error' in r).toBe(true)
  })
})

describe('parseYyMmDdFolder', () => {
  it('parses valid folder', () => {
    expect(parseYyMmDdFolder('260915-Phát hành TKCS')).toEqual({
      packageDate: '2026-09-15',
      description: 'Phát hành TKCS',
    })
  })
  it('skips invalid', () => {
    expect(parseYyMmDdFolder('abc')).toBeNull()
    expect(parseYyMmDdFolder('261345-x')).toBeNull()
  })
})

describe('roleInCodes', () => {
  it('matches EM for HVAC role_codes', () => {
    expect(roleInCodes('EM', 'HVAC,EM')).toBe(true)
  })
})

describe('revision', () => {
  it('counts revisions', () => {
    expect(revisionCountForDiscipline(4)).toBe(3)
  })
  it('assigns R by date order', () => {
    const pkgs = [
      { id: 1, folder_name: '260901-A', package_date: '2026-09-01' },
      { id: 2, folder_name: '260915-B', package_date: '2026-09-15' },
      { id: 3, folder_name: '260920-C', package_date: '2026-09-20' },
    ]
    const map = assignRevisionNumbers(pkgs)
    expect(displayRevision(pkgs[2], map)).toBe('R2')
  })
})

describe('normalizeNasPath', () => {
  it('collapses doubled backslashes on drive paths', () => {
    const doubled = 'C:\\\\Users\\\\NguyenNguyenVan\\\\Downloads\\\\01 TKCS\\\\260506-Ho So TKCS\\\\2.KET CAU'
    expect(normalizeNasPath(doubled)).toBe(
      'C:\\Users\\NguyenNguyenVan\\Downloads\\01 TKCS\\260506-Ho So TKCS\\2.KET CAU',
    )
  })
  it('preserves UNC leading slashes', () => {
    expect(normalizeNasPath('\\\\fileserver\\\\share\\\\BOD')).toBe('\\\\fileserver\\share\\BOD')
  })
})

describe('validateDesignFolderPath', () => {
  it('clears empty path', () => {
    expect(validateDesignFolderPath('', null)).toEqual({ ok: true, path: null })
  })
  it('rejects parent segments', () => {
    expect(validateDesignFolderPath('D:\\..\\secret', null).ok).toBe(false)
  })
  it('requires path under nas root when configured', () => {
    const r = validateDesignFolderPath('D:\\other', 'Z:\\NAS')
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.error).toContain('NAS')
  })
  it('accepts path under nas root', () => {
    expect(validateDesignFolderPath('Z:\\NAS\\BOD\\KT', 'Z:\\NAS')).toEqual({
      ok: true,
      path: 'Z:\\NAS\\BOD\\KT',
    })
  })
})

describe('compareHstkToPackages', () => {
  const pkgs = [
    { id: 1, folder_name: '260901-A', package_date: '2026-09-01' },
    { id: 2, folder_name: '260915-B', package_date: '2026-09-15' },
  ]
  const map = assignRevisionNumbers(pkgs)
  it('latest match', () => {
    expect(compareHstkToPackages('260915-B', pkgs, map)).toBe('match_latest')
  })
  it('old match', () => {
    expect(compareHstkToPackages('260901-A', pkgs, map)).toBe('match_old')
  })
})

describe('mergeScanFolderNames', () => {
  it('includes YYMMDD leaf of saved path plus children', () => {
    const path = 'C:\\Users\\me\\Downloads\\01 TKCS\\260506-Ho So TKCS'
    expect(mergeScanFolderNames(path, ['260701-Other'])).toEqual([
      '260506-Ho So TKCS',
      '260701-Other',
    ])
  })
  it('ignores non-package leaf', () => {
    expect(mergeScanFolderNames('C:\\01 TKCS', ['260506-Ho So TKCS'])).toEqual(['260506-Ho So TKCS'])
  })
})

describe('parsePackageFromFolderPath', () => {
  it('reads YYMMDD-name from last path segment (keeps plus sign)', () => {
    const path = 'C:\\Users\\NguyenNguyenVan\\Downloads\\01 TKCS\\260518-Canh quan+HTKT'
    expect(parsePackageFromFolderPath(path)).toEqual({
      folderName: '260518-Canh quan+HTKT',
      packageDate: '2026-05-18',
      description: 'Canh quan+HTKT',
    })
  })
})

describe('buildCategoryDossierStatus', () => {
  const pkgs = [
    { id: 1, folder_name: '260518-Canh quan+HTKT', package_date: '2026-05-18', description: 'Canh quan+HTKT', missing_since: null, updated_at: '2026-05-20 10:00:00' },
    { id: 2, folder_name: '260905-HSTK cap nhat', package_date: '2026-09-05', description: 'HSTK cap nhat', missing_since: null, updated_at: '2026-09-06 12:00:00' },
  ]
  const revMap = assignRevisionNumbers(pkgs)

  it('two categories under one discipline show different latest headlines', () => {
    const pathA = 'Z:\\DuAn\\AA\\NLV\\260518-Canh quan+HTKT'
    const pathB = 'Z:\\DuAn\\AA\\NTB\\260905-HSTK cap nhat'
    const statusA = buildCategoryDossierStatus(pathA, pkgs, revMap)
    const statusB = buildCategoryDossierStatus(pathB, pkgs, revMap)
    expect(statusA.latest_headline).toBe('18/05/2026 — Canh quan+HTKT')
    expect(statusB.latest_headline).toBe('05/09/2026 — HSTK cap nhat')
    expect(statusA.latest_headline).not.toBe(statusB.latest_headline)
    expect(statusA.current_revision).toBe('R0')
    expect(statusB.current_revision).toBe('R1')
    expect(statusA.package_updated_at).toBe('2026-05-20 10:00:00')
    expect(statusB.package_updated_at).toBe('2026-09-06 12:00:00')
  })

  it('no saved path yields empty dossier fields', () => {
    const empty = buildCategoryDossierStatus(null, pkgs, revMap)
    expect(empty.latest_headline).toBeNull()
    expect(empty.current_revision).toBeNull()
    expect(empty.revision_change_count).toBe(0)
  })
})

describe('pickDisciplineHeadlinePackage', () => {
  const pkgs = [
    { id: 1, folder_name: '260518-Canh quan+HTKT', package_date: '2026-05-18', missing_since: null },
    { id: 2, folder_name: '260905-HSTK cap nhat', package_date: '2026-09-05', missing_since: null },
  ]

  it('two categories under one discipline keep different last-segment packages', () => {
    const pathA = 'Z:\\DuAn\\AA\\260518-Canh quan+HTKT'
    const pathB = 'Z:\\DuAn\\AA\\260905-HSTK cap nhat'
    expect(pickLatestPackageForDiscipline(pathA, pkgs)?.folder_name).toBe('260518-Canh quan+HTKT')
    expect(pickLatestPackageForDiscipline(pathB, pkgs)?.folder_name).toBe('260905-HSTK cap nhat')
  })

  it('discipline headline picks newest among category paths', () => {
    const pathA = 'Z:\\DuAn\\AA\\260518-Canh quan+HTKT'
    const pathB = 'Z:\\DuAn\\AA\\260905-HSTK cap nhat'
    const headline = pickDisciplineHeadlinePackage([pathA, pathB], pkgs)
    expect(headline?.folder_name).toBe('260905-HSTK cap nhat')
  })

  it('changing one category path does not change another category latest', () => {
    const pathA = 'Z:\\DuAn\\AA\\260518-Canh quan+HTKT'
    const pathB = 'Z:\\DuAn\\AA\\260905-HSTK cap nhat'
    const onlyA = pickLatestPackageForDiscipline(pathA, pkgs)
    const onlyB = pickLatestPackageForDiscipline(pathB, pkgs)
    expect(onlyA?.folder_name).not.toBe(onlyB?.folder_name)
    const pathA2 = 'Z:\\DuAn\\AA\\other\\260518-Canh quan+HTKT'
    expect(pickLatestPackageForDiscipline(pathA2, pkgs)?.folder_name).toBe('260518-Canh quan+HTKT')
    expect(pickLatestPackageForDiscipline(pathB, pkgs)?.folder_name).toBe('260905-HSTK cap nhat')
  })
})

describe('designStoredPathsEqual', () => {
  it('treats normalized paths as unchanged for save skip', () => {
    expect(designStoredPathsEqual('Z:\\A\\\\B', 'Z:\\A\\B')).toBe(true)
    expect(designStoredPathsEqual('Z:\\A\\B', 'Z:\\A\\C')).toBe(false)
  })
})

describe('taskEligibleForCategoryPackageNotify', () => {
  it('filters assignees to matching category when categoryId set', () => {
    expect(taskEligibleForCategoryPackageNotify({ category_id: 3 }, 3)).toBe(true)
    expect(taskEligibleForCategoryPackageNotify({ category_id: 2 }, 3)).toBe(false)
    expect(taskEligibleForCategoryPackageNotify({ category_id: null }, 3)).toBe(false)
  })
})

describe('pickLatestPackageForDiscipline', () => {
  it('headline follows saved path leaf, not a newer dated package in DB', () => {
    const path = 'C:\\Users\\NguyenNguyenVan\\Downloads\\01 TKCS\\260518-Canh quan+HTKT'
    const pkgs = [
      { id: 1, folder_name: '260905-HSTK cap nhat', package_date: '2026-09-05', missing_since: null },
      { id: 2, folder_name: '260518-Canh quan+HTKT', package_date: '2026-05-18', missing_since: null },
    ]
    const latest = pickLatestPackageForDiscipline(path, pkgs)
    expect(latest?.folder_name).toBe('260518-Canh quan+HTKT')
    expect(latest?.package_date).toBe('2026-05-18')
  })
})

describe('pickLatestPresentPackage', () => {
  it('latest package follows the current folder scan, not missing older packages', () => {
    const pkgs = [
      { id: 1, folder_name: '250905-HSTK cap nhat', package_date: '2025-09-05', missing_since: '2026-09-30' },
      { id: 2, folder_name: '260506-Ho So TKCS', package_date: '2026-05-06', missing_since: null },
    ]
    const latest = pickLatestPresentPackage(pkgs)
    expect(latest?.folder_name).toBe('260506-Ho So TKCS')
  })
})

describe('pickPrimaryModelTask', () => {
  it('picks highest task id', () => {
    expect(pickPrimaryModelTask([{ id: 1 }, { id: 5 }, { id: 3 }])?.id).toBe(5)
  })
})

describe('modelMatrixAssigneeFromTasks', () => {
  it('uses primary task assignee name (highest id)', () => {
    const tasks = [
      { id: 2, assigned_to_name: 'Phạm Thị D' },
      { id: 9, assigned_to_name: 'Lê Văn C' },
    ]
    expect(modelMatrixAssigneeFromTasks(tasks)).toBe('Lê Văn C')
  })

  it('empty task list yields null', () => {
    expect(modelMatrixAssigneeFromTasks([])).toBe(null)
  })
})

describe('modelMatrixCvFromTasks', () => {
  const tasks = [
    { id: 2, status: 'in_progress', progress: 40, cde_report: 0 },
    { id: 9, status: 'review', progress: 75, cde_report: 1 },
  ]

  it('overview row uses primary task status, progress, and CDE flag', () => {
    expect(modelMatrixCvFromTasks(tasks)).toEqual({
      task_status: 'review',
      task_progress_percent: 75,
      task_cde_report: true,
    })
  })

  it('empty task list yields em-dash placeholders (null fields)', () => {
    expect(primaryTaskCvReportFields(null)).toEqual({
      task_status: null,
      task_progress_percent: null,
      task_cde_report: null,
    })
    expect(modelMatrixCvFromTasks([])).toEqual({
      task_status: null,
      task_progress_percent: null,
      task_cde_report: null,
    })
  })

  it('unchanged when extra design packages exist but tasks are the same', () => {
    const before = modelMatrixCvFromTasks(tasks)
    const extraPkgs = [
      { id: 100, folder_name: '260930-NewPkg', package_date: '2026-09-30' },
      { id: 101, folder_name: '261001-Another', package_date: '2026-10-01' },
    ]
    expect(extraPkgs.length).toBe(2)
    expect(modelMatrixCvFromTasks(tasks)).toEqual(before)
  })
})

describe('formatLatestPackageHeadline', () => {
  it('matches QLy HSTK status line format', () => {
    expect(
      formatLatestPackageHeadline({
        package_date: '2026-05-06',
        description: 'Ho So TKCS',
        folder_name: '260506-Ho So TKCS',
      }),
    ).toBe('06/05/2026 — Ho So TKCS')
  })
})

describe('resolveEmptyTaskDescription', () => {
  const latest = {
    id: 1,
    folder_name: '260506-Ho So TKCS',
    package_date: '2026-05-06',
    description: 'Ho So TKCS',
  }
  it('fills empty description with latest HSTK headline', () => {
    expect(resolveEmptyTaskDescription('', latest)).toBe('06/05/2026 — Ho So TKCS')
    expect(resolveEmptyTaskDescription(null, latest)).toBe('06/05/2026 — Ho So TKCS')
  })
  it('keeps non-empty description', () => {
    expect(resolveEmptyTaskDescription('Yêu cầu riêng', latest)).toBe('Yêu cầu riêng')
  })
})

describe('modelMatrixRevisionUpdatedFromTasks', () => {
  const pkgs = [
    { id: 1, folder_name: '260506-Ho So TKCS', package_date: '2026-05-06' },
    { id: 2, folder_name: '260518-Canh quan+HTKT', package_date: '2026-05-18' },
  ]
  const map = assignRevisionNumbers(pkgs)

  it('primary task on older package shows R0 (latest discipline rev is R1)', () => {
    const tasks = [
      { id: 9, design_package_id: 1, hstk_date: '260506-Ho So TKCS', status: 'in_progress' },
    ]
    expect(modelMatrixRevisionUpdatedFromTasks(tasks, pkgs, map)).toBe('R0')
    expect(displayRevision(pkgs[1], map)).toBe('R1')
  })

  it('primary task on latest package shows same rev as current (R1 / R1)', () => {
    const tasks = [
      { id: 9, design_package_id: 2, hstk_date: '260518-Canh quan+HTKT', status: 'review' },
    ]
    expect(modelMatrixRevisionUpdatedFromTasks(tasks, pkgs, map)).toBe('R1')
  })

  it('no task yields null left rev', () => {
    expect(modelMatrixRevisionUpdatedFromTasks([], pkgs, map)).toBe(null)
  })
})

describe('collectDesignPackageNotifyRecipientUserIds', () => {
  const disciplineCode = 'KT'
  const pkgs = [
    { id: 10, folder_name: '260915-B', package_date: '2026-09-15' },
    { id: 11, folder_name: '260901-A', package_date: '2026-09-01' },
  ]
  const revMap = assignRevisionNumbers(pkgs)
  const packageIds = new Set(pkgs.map(p => p.id))

  it('includes project leader and discipline assignee, excludes unrelated member', () => {
    const leaderId = 101
    const assigneeId = 202
    const tasks = [
      {
        assigned_to: assigneeId,
        discipline_code: 'KT',
        model_filename: 'TT09-OAD-HZ-BF-M3-A-0001-HAM.rvt',
        design_package_id: 10,
      },
      {
        assigned_to: 303,
        discipline_code: 'KC',
        model_filename: 'TT09-OAD-HZ-BF-M3-S-0001.rvt',
      },
    ]
    const ids = collectDesignPackageNotifyRecipientUserIds(
      collectProjectLeaderUserIds(leaderId, []),
      tasks,
      disciplineCode,
      packageIds,
      pkgs,
      revMap,
    )
    expect(ids.sort()).toEqual([leaderId, assigneeId].sort())
    expect(ids).not.toContain(303)
  })

  it('dedupes when leader is also the task assignee', () => {
    const leaderAssignee = 55
    const tasks = [
      {
        assigned_to: leaderAssignee,
        discipline_code: 'KT',
        model_filename: 'TT09-OAD-HZ-BF-M3-A-0001.rvt',
        design_package_id: 10,
      },
    ]
    const ids = collectDesignPackageNotifyRecipientUserIds(
      collectProjectLeaderUserIds(leaderAssignee, [leaderAssignee]),
      tasks,
      disciplineCode,
      packageIds,
      pkgs,
      revMap,
    )
    expect(ids).toEqual([leaderAssignee])
  })

  it('includes assignee linked only via Theo HSTK folder name on discipline packages', () => {
    const assigneeId = 404
    const tasks = [
      {
        assigned_to: assigneeId,
        discipline_code: null,
        hstk_date: '260915-B',
        model_filename: null,
        design_package_id: null,
      },
    ]
    const ids = collectDesignPackageNotifyRecipientUserIds([], tasks, disciplineCode, packageIds, pkgs, revMap)
    expect(ids).toEqual([assigneeId])
  })
})

describe('project dashboard HSTK stats', () => {
  const pkgs = [
    { id: 1, folder_name: '260506-Ho So TKCS', package_date: '2026-05-06', missing_since: '2026-09-30' },
    { id: 2, folder_name: '260518-Canh quan+HTKT', package_date: '2026-05-18', missing_since: '2026-09-30' },
    { id: 3, folder_name: '260905-HSTK cap nhat', package_date: '2026-09-05', missing_since: '2026-09-30' },
    { id: 4, folder_name: '261001-Phat hanh moi', package_date: '2026-10-01', missing_since: null },
  ]

  it('does not emit không còn trên NAS for missing historical packages', () => {
    const blockers = dashboardPackageMissingNasBlockers(pkgs)
    expect(blockers.some(b => b.includes('không còn trên NAS'))).toBe(false)
    expect(blockers).toEqual([])
  })

  it('recent timeline list is capped at the 3 newest by package date', () => {
    const recent = dashboardTimelinePackages(pkgs, 3)
    expect(recent).toHaveLength(3)
    expect(recent.map(p => p.folder_name)).toEqual([
      '261001-Phat hanh moi',
      '260905-HSTK cap nhat',
      '260518-Canh quan+HTKT',
    ])
  })
})

describe('buildHstkReference', () => {
  const pkgs = [
    { id: 10, folder_name: '260915-B', package_date: '2026-09-15' },
    { id: 11, folder_name: '260901-A', package_date: '2026-09-01' },
  ]
  const map = assignRevisionNumbers(pkgs)
  it('uses linked package', () => {
    expect(buildHstkReference({ hstk_date: '260915-B', design_package_id: 10 }, pkgs, map)).toContain('260915-B')
  })
  it('falls back to raw hstk_date', () => {
    expect(buildHstkReference({ hstk_date: 'custom-label', design_package_id: null }, pkgs, map)).toBe('custom-label')
  })
})
