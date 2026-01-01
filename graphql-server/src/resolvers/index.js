import * as masterDataResolvers from './masterDataResolvers.js'
import * as authResolvers from './authResolvers.js'
import * as salesResolvers from './salesResolvers.js'

/**
 * GraphQLリゾルバの統合
 */
export const resolvers = {
  Query: {
    // マスタデータ
    departments: () => masterDataResolvers.getDepartments(),
    wards: () => masterDataResolvers.getWards(),
    
    // 認証
    verifyStaff: (_, { staffId }) => authResolvers.verifyStaff(staffId),
    
    // 売上データ
    doctors: () => salesResolvers.getDoctors(),
    doctorsByDepartment: (_, { departmentCode }) => 
      salesResolvers.getDoctorsByDepartment(departmentCode),
    salesSummary: (_, { startMonth, endMonth }) => 
      salesResolvers.getSalesSummary(startMonth, endMonth),
    salesByDoctor: (_, { doctorCode, startMonth, endMonth }) => 
      salesResolvers.getSalesByDoctor(doctorCode, startMonth, endMonth),
    
    // TODO: 外来・入院データのリゾルバを追加
  },
}

export default resolvers
