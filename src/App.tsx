import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'

import styles from './App.module.css'
import LogoGrantApp from './assets/LogoGrantApp.png'
import { ApplicationList } from './pages/ApplicationList/ApplicationList'
import { CommonFields } from './pages/CommonFields/CommonFields'
import { CreateApplication } from './pages/CreateApplication/CreateApplication'
import { Dashboard } from './pages/Dashboard/Dashboard'
import { EditApplication } from './pages/EditApplication/EditApplication'
import { ViewApplication } from './pages/ViewApplication/ViewApplication'
import { useApplicationsStore, useCommonFieldsStore } from './store'
import { getApplicationFieldValues, saveApplicationFieldValues } from './utils'

export default function App() {
  const { applications } = useApplicationsStore()
  const { commonFields } = useCommonFieldsStore()

  const commonFieldsHash = (() => {
    const signature = commonFields
      .map((field) => `${field.id}:${field.group}:${field.label}:${field.type}`)
      .sort((left, right) => left.localeCompare(right))
      .join('|')
    let hash = 0
    for (let index = 0; index < signature.length; index += 1) {
      const code = signature.codePointAt(index) ?? 0
      hash = Math.trunc(hash * 31 + code)
    }
    return Math.abs(hash).toString(36)
  })()

  useEffect(() => {
    if (applications.length === 0 || commonFields.length === 0) return
    const backfillFlag = `grant-manager.field-values.backfilled.v1:${commonFieldsHash}`
    if (globalThis.localStorage?.getItem(backfillFlag) === 'true') return
    for (const application of applications) {
      const existing = getApplicationFieldValues(application.id)
      if (existing) continue
      saveApplicationFieldValues(application, commonFields)
    }
    globalThis.localStorage?.setItem(backfillFlag, 'true')
  }, [applications, commonFields, commonFieldsHash])

  return (
    <HashRouter>
      <div className={styles.app}>
        <header className={styles.banner}>
          <div className={styles.bannerInner}>
            <img
              className={styles.bannerImage}
              src={LogoGrantApp}
              alt="GrantMatrix Logo"
            />
          </div>
        </header>
        <div className={styles.content}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/common" element={<CommonFields />} />
            <Route path="/applications" element={<ApplicationList />} />
            <Route path="/applications/new" element={<CreateApplication />} />
            <Route path="/applications/:id" element={<ViewApplication />} />
            <Route path="/applications/:id/edit" element={<EditApplication />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </HashRouter>
  )
}
