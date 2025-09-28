'use client'

import OrderDetailsTemplate from "@/components/modules/order/OrderDetailsTemplate";
import { UUID } from "crypto";
import { useParams, useRouter } from "next/navigation";

export default function OrderDetailsPage() {
  const params = useParams()
  const router = useRouter()

  const { id } = params

  return (
    <div>
      <OrderDetailsTemplate orderId={id as UUID} onBack={() => {router.back()}}/>
    </div>
  )
}