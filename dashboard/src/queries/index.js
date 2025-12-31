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

export const GET_DOCTORS = gql`
  query GetDoctors {
    doctors {
      code
      name
      departmentCode
      department {
        code
        name
      }
    }
  }
`

export const GET_DOCTORS_BY_DEPARTMENT = gql`
  query GetDoctorsByDepartment($departmentCode: String!) {
    doctorsByDepartment(departmentCode: $departmentCode) {
      code
      name
      departmentCode
    }
  }
`

export const GET_SALES_SUMMARY = gql`
  query GetSalesSummary($startMonth: String, $endMonth: String) {
    salesSummary(startMonth: $startMonth, endMonth: $endMonth) {
      yearMonth
      totalOutpatientSales
      totalInpatientSales
      totalSales
    }
  }
`

export const GET_SALES_BY_DOCTOR = gql`
  query GetSalesByDoctor($doctorCode: String!, $startMonth: String, $endMonth: String) {
    salesByDoctor(doctorCode: $doctorCode, startMonth: $startMonth, endMonth: $endMonth) {
      yearMonth
      outpatientSales
      inpatientSales
      totalSales
    }
  }
`

export const GET_SALES_BY_DEPARTMENT = gql`
  query GetSalesByDepartment($departmentCode: String!, $startMonth: String, $endMonth: String) {
    salesByDepartment(departmentCode: $departmentCode, startMonth: $startMonth, endMonth: $endMonth) {
      yearMonth
      totalOutpatientSales
      totalInpatientSales
      totalSales
    }
  }
`

export const GET_SALES_BY_DOCTORS_IN_DEPARTMENT = gql`
  query GetSalesByDoctorsInDepartment($departmentCode: String!, $startMonth: String, $endMonth: String) {
    salesByDoctorsInDepartment(departmentCode: $departmentCode, startMonth: $startMonth, endMonth: $endMonth) {
      doctor {
        code
        name
        displayOrder
      }
      sales {
        yearMonth
        outpatientSales
        inpatientSales
        totalSales
      }
    }
  }
`

