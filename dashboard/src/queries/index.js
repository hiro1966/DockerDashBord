import { gql } from '@apollo/client'

export const GET_DEPARTMENTS = gql`
  query GetDepartments {
    departments {
      id
      code
      name
    }
  }
`

export const GET_WARDS = gql`
  query GetWards {
    wards {
      id
      code
      name
      capacity
    }
  }
`

export const GET_OUTPATIENT_SUMMARY = gql`
  query GetOutpatientSummary($startDate: String, $endDate: String) {
    outpatientSummary(startDate: $startDate, endDate: $endDate) {
      date
      totalNew
      totalReturning
      totalPatients
    }
  }
`

export const GET_OUTPATIENT_BY_DEPARTMENT = gql`
  query GetOutpatientByDepartment($startDate: String, $endDate: String) {
    outpatientByDepartment(startDate: $startDate, endDate: $endDate) {
      department {
        id
        code
        name
      }
      totalNew
      totalReturning
      totalPatients
    }
  }
`

export const GET_INPATIENT_SUMMARY = gql`
  query GetInpatientSummary($startDate: String, $endDate: String) {
    inpatientSummary(startDate: $startDate, endDate: $endDate) {
      date
      totalCurrent
      totalNewAdmission
      totalDischarge
      totalTransferOut
      totalTransferIn
    }
  }
`

export const GET_INPATIENT_BY_WARD = gql`
  query GetInpatientByWard($startDate: String, $endDate: String) {
    inpatientByWard(startDate: $startDate, endDate: $endDate) {
      ward {
        id
        code
        name
        capacity
      }
      totalCurrent
      totalNewAdmission
      totalDischarge
    }
  }
`
