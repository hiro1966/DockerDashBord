import { createContext, useContext, useState, useEffect } from 'react'
import { useQuery } from '@apollo/client'
import { gql } from '@apollo/client'

const VERIFY_STAFF = gql`
  query VerifyStaff($staffId: String!) {
    verifyStaff(staffId: $staffId) {
      id
      name
      jobTypeCode
      permission {
        jobTypeCode
        jobTypeName
        level
      }
    }
  }
`

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [staff, setStaff] = useState(null)
  const [loading, setLoading] = useState(true)
  const [staffId, setStaffId] = useState(null)

  // URLパラメータまたはsessionStorageから職員IDを取得
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlStaffId = params.get('staffId')
    
    if (urlStaffId) {
      setStaffId(urlStaffId)
      sessionStorage.setItem('staffId', urlStaffId)
    } else {
      const storedStaffId = sessionStorage.getItem('staffId')
      if (storedStaffId) {
        setStaffId(storedStaffId)
      } else {
        setLoading(false)
      }
    }
  }, [])

  const { data, error } = useQuery(VERIFY_STAFF, {
    variables: { staffId },
    skip: !staffId,
    onCompleted: () => setLoading(false),
    onError: () => setLoading(false),
  })

  useEffect(() => {
    if (data?.verifyStaff) {
      setStaff(data.verifyStaff)
    } else if (error || (data && !data.verifyStaff)) {
      setStaff(null)
      sessionStorage.removeItem('staffId')
    }
  }, [data, error])

  const logout = () => {
    setStaff(null)
    setStaffId(null)
    sessionStorage.removeItem('staffId')
    window.location.href = '/'
  }

  const hasPermission = (requiredLevel) => {
    return staff && staff.permission.level >= requiredLevel
  }

  return (
    <AuthContext.Provider value={{ staff, loading, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  )
}
