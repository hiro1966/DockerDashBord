export const typeDefs = `
  type Department {
    id: Int!
    code: String!
    name: String!
    displayOrder: Int!
    createdAt: String!
  }

  type Ward {
    id: Int!
    code: String!
    name: String!
    capacity: Int!
    displayOrder: Int!
    createdAt: String!
  }

  type OutpatientRecord {
    id: Int!
    date: String!
    department: Department!
    newPatientsCount: Int!
    returningPatientsCount: Int!
    totalCount: Int!
    createdAt: String!
  }

  type InpatientRecord {
    id: Int!
    date: String!
    ward: Ward!
    department: Department!
    currentPatientCount: Int!
    newAdmissionCount: Int!
    dischargeCount: Int!
    transferOutCount: Int!
    transferInCount: Int!
    createdAt: String!
  }

  type OutpatientSummary {
    date: String!
    totalNew: Int!
    totalReturning: Int!
    totalPatients: Int!
  }

  type InpatientSummary {
    date: String!
    totalCurrent: Int!
    totalNewAdmission: Int!
    totalDischarge: Int!
    totalTransferOut: Int!
    totalTransferIn: Int!
  }

  type OutpatientByDepartment {
    department: Department!
    totalNew: Int!
    totalReturning: Int!
    totalPatients: Int!
  }

  type InpatientByWard {
    ward: Ward!
    totalCurrent: Int!
    totalNewAdmission: Int!
    totalDischarge: Int!
  }

  type Permission {
    jobTypeCode: String!
    jobTypeName: String!
    level: Int!
  }

  type Staff {
    id: String!
    name: String!
    jobTypeCode: String!
    permission: Permission!
    createdAt: String!
  }

  type Doctor {
    code: String!
    name: String!
    departmentCode: String!
    displayOrder: Int!
    department: Department!
    createdAt: String!
  }

  type Sales {
    doctorCode: String!
    yearMonth: String!
    outpatientSales: Float!
    inpatientSales: Float!
    totalSales: Float!
    updatedAt: String!
  }

  type SalesSummary {
    yearMonth: String!
    totalOutpatientSales: Float!
    totalInpatientSales: Float!
    totalSales: Float!
  }

  type DoctorSales {
    doctor: Doctor!
    sales: [Sales!]!
  }

  type Query {
    # マスタデータ
    departments: [Department!]!
    wards: [Ward!]!
    
    # 外来患者データ
    outpatientRecords(startDate: String, endDate: String, departmentId: Int): [OutpatientRecord!]!
    outpatientSummary(startDate: String, endDate: String): [OutpatientSummary!]!
    outpatientByDepartment(startDate: String, endDate: String): [OutpatientByDepartment!]!
    
    # 入院患者データ
    inpatientRecords(startDate: String, endDate: String, wardId: Int, departmentId: Int): [InpatientRecord!]!
    inpatientSummary(startDate: String, endDate: String): [InpatientSummary!]!
    inpatientByWard(startDate: String, endDate: String): [InpatientByWard!]!
    
    # 認証
    verifyStaff(staffId: String!): Staff
    
    # 売上データ
    doctors: [Doctor!]!
    doctorsByDepartment(departmentCode: String!): [Doctor!]!
    salesSummary(startMonth: String, endMonth: String): [SalesSummary!]!
    salesByDoctor(doctorCode: String!, startMonth: String, endMonth: String): [Sales!]!
    salesByDepartment(departmentCode: String!, startMonth: String, endMonth: String): [SalesSummary!]!
    salesByDoctorsInDepartment(departmentCode: String!, startMonth: String, endMonth: String): [DoctorSales!]!
  }
`

export default typeDefs
