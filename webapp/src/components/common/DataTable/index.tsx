import { useState } from 'react'
import { Input, Table } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import { SearchOutlined } from '@ant-design/icons'

interface DataTableProps<T> {
  columns: ColumnsType<T>
  dataSource: T[]
  loading: boolean
  pagination: {
    current: number
    pageSize: number
    total: number
    onChange: (page: number, pageSize: number) => void
  }
  searchPlaceholder?: string
  onSearch?: (keyword: string) => void
  rowKey?: string | ((record: T) => string)
}

export function DataTable<T extends object>({
  columns,
  dataSource,
  loading,
  pagination,
  searchPlaceholder = '搜索...',
  onSearch,
  rowKey,
}: DataTableProps<T>) {
  const [keyword, setKeyword] = useState('')

  const handleSearch = (value: string) => {
    setKeyword(value)
    onSearch?.(value)
  }

  const tablePagination: TablePaginationConfig = {
    current: pagination.current,
    pageSize: pagination.pageSize,
    total: pagination.total,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total) => `共 ${total} 条`,
    onChange: pagination.onChange,
  }

  return (
    <div>
      {onSearch && (
        <div className="flex justify-end mb-4">
          <Input.Search
            placeholder={searchPlaceholder}
            allowClear
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={handleSearch}
            prefix={<SearchOutlined />}
            style={{ width: 280 }}
          />
        </div>
      )}
      <Table
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        rowKey={rowKey}
        pagination={tablePagination}
        scroll={{ x: 'max-content' }}
      />
    </div>
  )
}
