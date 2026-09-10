import type { Request, Response } from 'express'

import {
  createAdminCategory,
  deleteAdminCategory,
  getAdminCategories,
  getAdminCategoryById,
  updateAdminCategory,
} from '../services/category.service.js'

function parsePositiveInteger(
  value: unknown,
): number | null {
  const numberValue =
    Number(value)

  if (
    !Number.isInteger(numberValue) ||
    numberValue <= 0
  ) {
    return null
  }

  return numberValue
}

function parseOptionalInteger(
  value: unknown,
): number | null | undefined {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return undefined
  }

  const numberValue =
    Number(value)

  if (!Number.isInteger(numberValue)) {
    return null
  }

  return numberValue
}

export async function getCategories(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const page =
      req.query.page !== undefined
        ? parsePositiveInteger(
            req.query.page,
          )
        : undefined

    const pageSize =
      req.query.pageSize !== undefined
        ? parsePositiveInteger(
            req.query.pageSize,
          )
        : undefined

    if (
      req.query.page !== undefined &&
      page === null
    ) {
      res.status(400).json({
        success: false,
        message: 'Invalid page',
      })
      return
    }

    if (
      req.query.pageSize !== undefined &&
      pageSize === null
    ) {
      res.status(400).json({
        success: false,
        message: 'Invalid pageSize',
      })
      return
    }

    let status:
      | number
      | undefined

    if (
      req.query.status !== undefined &&
      req.query.status !== ''
    ) {
      const parsedStatus =
        Number(req.query.status)

      if (
        parsedStatus !== 0 &&
        parsedStatus !== 1
      ) {
        res.status(400).json({
          success: false,
          message: 'Invalid status',
        })
        return
      }

      status = parsedStatus
    }

    const parentId =
      parseOptionalInteger(
        req.query.parentId,
      )

    if (
      req.query.parentId !== undefined &&
      parentId === null
    ) {
      res.status(400).json({
        success: false,
        message: 'Invalid parentId',
      })
      return
    }

    const result =
      await getAdminCategories({
        page:
          page ?? undefined,
        pageSize:
          pageSize ?? undefined,
        keyword:
          typeof req.query.keyword ===
          'string'
            ? req.query.keyword
            : undefined,
        status,
        parentId,
      })

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error(
      'Failed to fetch admin categories:',
      error,
    )

    res.status(500).json({
      success: false,
      message:
        'Failed to fetch categories',
    })
  }
}

export async function getCategory(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const id =
      parsePositiveInteger(
        req.params.id,
      )

    if (id === null) {
      res.status(400).json({
        success: false,
        message: 'Invalid category ID',
      })
      return
    }

    const category =
      await getAdminCategoryById(id)

    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found',
      })
      return
    }

    res.json({
      success: true,
      data: category,
    })
  } catch (error) {
    console.error(
      'Failed to fetch admin category:',
      error,
    )

    res.status(500).json({
      success: false,
      message:
        'Failed to fetch category',
    })
  }
}

export async function createCategory(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const {
      parentId,
      nameZh,
      nameEn,
      slug,
      descriptionZh,
      descriptionEn,
      icon,
      sortOrder,
      status,
    } = req.body

    if (
      typeof nameZh !== 'string' ||
      !nameZh.trim()
    ) {
      res.status(400).json({
        success: false,
        message:
          'Chinese category name is required',
      })
      return
    }

    if (
      typeof nameEn !== 'string' ||
      !nameEn.trim()
    ) {
      res.status(400).json({
        success: false,
        message:
          'English category name is required',
      })
      return
    }

    if (
      typeof slug !== 'string' ||
      !slug.trim()
    ) {
      res.status(400).json({
        success: false,
        message:
          'Category slug is required',
      })
      return
    }

    if (
      parentId !== undefined &&
      parentId !== null &&
      !Number.isInteger(
        Number(parentId),
      )
    ) {
      res.status(400).json({
        success: false,
        message:
          'Invalid parentId',
      })
      return
    }

    if (
      status !== undefined &&
      status !== 0 &&
      status !== 1
    ) {
      res.status(400).json({
        success: false,
        message:
          'Invalid status',
      })
      return
    }

    if (
      sortOrder !== undefined &&
      !Number.isInteger(
        Number(sortOrder),
      )
    ) {
      res.status(400).json({
        success: false,
        message:
          'Invalid sortOrder',
      })
      return
    }

    const category =
      await createAdminCategory({
        parentId:
          parentId === undefined ||
          parentId === null
            ? null
            : Number(parentId),
        nameZh,
        nameEn,
        slug,
        descriptionZh,
        descriptionEn,
        icon,
        sortOrder:
          sortOrder !== undefined
            ? Number(sortOrder)
            : undefined,
        status,
      })

    res.status(201).json({
      success: true,
      message:
        'Category created successfully',
      data: category,
    })
  } catch (error) {
    console.error(
      'Failed to create admin category:',
      error,
    )

    const message =
      error instanceof Error
        ? error.message
        : ''

    if (
      message.includes(
        'Duplicate entry',
      )
    ) {
      res.status(409).json({
        success: false,
        message:
          'Category slug already exists',
      })
      return
    }

    res.status(500).json({
      success: false,
      message:
        message ||
        'Failed to create category',
    })
  }
}

export async function updateCategory(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const id =
      parsePositiveInteger(
        req.params.id,
      )

    if (id === null) {
      res.status(400).json({
        success: false,
        message: 'Invalid category ID',
      })
      return
    }

    const {
      parentId,
      nameZh,
      nameEn,
      slug,
      descriptionZh,
      descriptionEn,
      icon,
      sortOrder,
      status,
    } = req.body

    if (
      nameZh !== undefined &&
      (
        typeof nameZh !== 'string' ||
        !nameZh.trim()
      )
    ) {
      res.status(400).json({
        success: false,
        message:
          'Invalid Chinese category name',
      })
      return
    }

    if (
      nameEn !== undefined &&
      (
        typeof nameEn !== 'string' ||
        !nameEn.trim()
      )
    ) {
      res.status(400).json({
        success: false,
        message:
          'Invalid English category name',
      })
      return
    }

    if (
      slug !== undefined &&
      (
        typeof slug !== 'string' ||
        !slug.trim()
      )
    ) {
      res.status(400).json({
        success: false,
        message:
          'Invalid category slug',
      })
      return
    }

    if (
      parentId !== undefined &&
      parentId !== null &&
      !Number.isInteger(
        Number(parentId),
      )
    ) {
      res.status(400).json({
        success: false,
        message:
          'Invalid parentId',
      })
      return
    }

    if (
      status !== undefined &&
      status !== 0 &&
      status !== 1
    ) {
      res.status(400).json({
        success: false,
        message:
          'Invalid status',
      })
      return
    }

    if (
      sortOrder !== undefined &&
      !Number.isInteger(
        Number(sortOrder),
      )
    ) {
      res.status(400).json({
        success: false,
        message:
          'Invalid sortOrder',
      })
      return
    }

    const category =
      await updateAdminCategory(
        id,
        {
          parentId:
            parentId === undefined
              ? undefined
              : parentId === null
                ? null
                : Number(parentId),
          nameZh,
          nameEn,
          slug,
          descriptionZh,
          descriptionEn,
          icon,
          sortOrder:
            sortOrder !== undefined
              ? Number(sortOrder)
              : undefined,
          status,
        },
      )

    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found',
      })
      return
    }

    res.json({
      success: true,
      message:
        'Category updated successfully',
      data: category,
    })
  } catch (error) {
    console.error(
      'Failed to update admin category:',
      error,
    )

    const message =
      error instanceof Error
        ? error.message
        : ''

    if (
      message.includes(
        'Duplicate entry',
      )
    ) {
      res.status(409).json({
        success: false,
        message:
          'Category slug already exists',
      })
      return
    }

    if (
      message.includes(
        'cannot be its own parent',
      )
    ) {
      res.status(400).json({
        success: false,
        message,
      })
      return
    }

    res.status(500).json({
      success: false,
      message:
        message ||
        'Failed to update category',
    })
  }
}

export async function deleteCategory(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const id =
      parsePositiveInteger(
        req.params.id,
      )

    if (id === null) {
      res.status(400).json({
        success: false,
        message: 'Invalid category ID',
      })
      return
    }

    const category =
      await getAdminCategoryById(id)

    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found',
      })
      return
    }

    await deleteAdminCategory(id)

    res.json({
      success: true,
      message:
        'Category deleted successfully',
    })
  } catch (error) {
    console.error(
      'Failed to delete admin category:',
      error,
    )

    const message =
      error instanceof Error
        ? error.message
        : ''

    if (
      message.includes(
        'child categories',
      )
    ) {
      res.status(409).json({
        success: false,
        message:
          'Cannot delete category with child categories',
      })
      return
    }

    if (
      message.includes(
        'with products',
      )
    ) {
      res.status(409).json({
        success: false,
        message:
          'Cannot delete category with products',
      })
      return
    }

    res.status(500).json({
      success: false,
      message:
        message ||
        'Failed to delete category',
    })
  }
}

