--
-- PostgreSQL database dump
--

\restrict XDJKJ7Kcg0I0btGp2LAhEE3ZHjLO8vxAwJI429pVdqyFpdremU95e4s2QNlbbcf

-- Dumped from database version 16.13 (Debian 16.13-1.pgdg13+1)
-- Dumped by pg_dump version 16.13 (Debian 16.13-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_businessId_fkey";
ALTER TABLE IF EXISTS ONLY public."UserBranchAccess" DROP CONSTRAINT IF EXISTS "UserBranchAccess_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."UserBranchAccess" DROP CONSTRAINT IF EXISTS "UserBranchAccess_branchId_fkey";
ALTER TABLE IF EXISTS ONLY public."StockMovement" DROP CONSTRAINT IF EXISTS "StockMovement_productId_fkey";
ALTER TABLE IF EXISTS ONLY public."StockMovement" DROP CONSTRAINT IF EXISTS "StockMovement_idempotencyKeyId_fkey";
ALTER TABLE IF EXISTS ONLY public."StockMovement" DROP CONSTRAINT IF EXISTS "StockMovement_businessId_fkey";
ALTER TABLE IF EXISTS ONLY public."StockMovement" DROP CONSTRAINT IF EXISTS "StockMovement_branchId_fkey";
ALTER TABLE IF EXISTS ONLY public."StockMovement" DROP CONSTRAINT IF EXISTS "StockMovement_actorUserId_fkey";
ALTER TABLE IF EXISTS ONLY public."Session" DROP CONSTRAINT IF EXISTS "Session_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Product" DROP CONSTRAINT IF EXISTS "Product_categoryId_fkey";
ALTER TABLE IF EXISTS ONLY public."Product" DROP CONSTRAINT IF EXISTS "Product_businessId_fkey";
ALTER TABLE IF EXISTS ONLY public."ProductPrice" DROP CONSTRAINT IF EXISTS "ProductPrice_productId_fkey";
ALTER TABLE IF EXISTS ONLY public."ProductPrice" DROP CONSTRAINT IF EXISTS "ProductPrice_businessId_fkey";
ALTER TABLE IF EXISTS ONLY public."ProductCategory" DROP CONSTRAINT IF EXISTS "ProductCategory_businessId_fkey";
ALTER TABLE IF EXISTS ONLY public."ProductBranchAvailability" DROP CONSTRAINT IF EXISTS "ProductBranchAvailability_productId_fkey";
ALTER TABLE IF EXISTS ONLY public."ProductBranchAvailability" DROP CONSTRAINT IF EXISTS "ProductBranchAvailability_branchId_fkey";
ALTER TABLE IF EXISTS ONLY public."Payment" DROP CONSTRAINT IF EXISTS "Payment_orderId_fkey";
ALTER TABLE IF EXISTS ONLY public."Payment" DROP CONSTRAINT IF EXISTS "Payment_cashSessionId_fkey";
ALTER TABLE IF EXISTS ONLY public."Order" DROP CONSTRAINT IF EXISTS "Order_leadSourceId_fkey";
ALTER TABLE IF EXISTS ONLY public."Order" DROP CONSTRAINT IF EXISTS "Order_leadId_fkey";
ALTER TABLE IF EXISTS ONLY public."Order" DROP CONSTRAINT IF EXISTS "Order_customerId_fkey";
ALTER TABLE IF EXISTS ONLY public."Order" DROP CONSTRAINT IF EXISTS "Order_createdByUserId_fkey";
ALTER TABLE IF EXISTS ONLY public."Order" DROP CONSTRAINT IF EXISTS "Order_businessId_fkey";
ALTER TABLE IF EXISTS ONLY public."Order" DROP CONSTRAINT IF EXISTS "Order_branchId_fkey";
ALTER TABLE IF EXISTS ONLY public."OrderStatusHistory" DROP CONSTRAINT IF EXISTS "OrderStatusHistory_orderId_fkey";
ALTER TABLE IF EXISTS ONLY public."OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_productId_fkey";
ALTER TABLE IF EXISTS ONLY public."OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_orderId_fkey";
ALTER TABLE IF EXISTS ONLY public."Lead" DROP CONSTRAINT IF EXISTS "Lead_leadSourceId_fkey";
ALTER TABLE IF EXISTS ONLY public."Lead" DROP CONSTRAINT IF EXISTS "Lead_customerId_fkey";
ALTER TABLE IF EXISTS ONLY public."Lead" DROP CONSTRAINT IF EXISTS "Lead_businessId_fkey";
ALTER TABLE IF EXISTS ONLY public."Lead" DROP CONSTRAINT IF EXISTS "Lead_branchId_fkey";
ALTER TABLE IF EXISTS ONLY public."LeadSource" DROP CONSTRAINT IF EXISTS "LeadSource_businessId_fkey";
ALTER TABLE IF EXISTS ONLY public."LeadSource" DROP CONSTRAINT IF EXISTS "LeadSource_branchId_fkey";
ALTER TABLE IF EXISTS ONLY public."IdempotencyKey" DROP CONSTRAINT IF EXISTS "IdempotencyKey_businessId_fkey";
ALTER TABLE IF EXISTS ONLY public."Delivery" DROP CONSTRAINT IF EXISTS "Delivery_orderId_fkey";
ALTER TABLE IF EXISTS ONLY public."Delivery" DROP CONSTRAINT IF EXISTS "Delivery_businessId_fkey";
ALTER TABLE IF EXISTS ONLY public."Delivery" DROP CONSTRAINT IF EXISTS "Delivery_addressId_fkey";
ALTER TABLE IF EXISTS ONLY public."DeliveryZone" DROP CONSTRAINT IF EXISTS "DeliveryZone_businessId_fkey";
ALTER TABLE IF EXISTS ONLY public."DeliveryZone" DROP CONSTRAINT IF EXISTS "DeliveryZone_branchId_fkey";
ALTER TABLE IF EXISTS ONLY public."Customer" DROP CONSTRAINT IF EXISTS "Customer_businessId_fkey";
ALTER TABLE IF EXISTS ONLY public."CashSession" DROP CONSTRAINT IF EXISTS "CashSession_openedByUserId_fkey";
ALTER TABLE IF EXISTS ONLY public."CashSession" DROP CONSTRAINT IF EXISTS "CashSession_closedByUserId_fkey";
ALTER TABLE IF EXISTS ONLY public."CashSession" DROP CONSTRAINT IF EXISTS "CashSession_businessId_fkey";
ALTER TABLE IF EXISTS ONLY public."CashSession" DROP CONSTRAINT IF EXISTS "CashSession_branchId_fkey";
ALTER TABLE IF EXISTS ONLY public."CashMovement" DROP CONSTRAINT IF EXISTS "CashMovement_cashSessionId_fkey";
ALTER TABLE IF EXISTS ONLY public."CashMovement" DROP CONSTRAINT IF EXISTS "CashMovement_businessId_fkey";
ALTER TABLE IF EXISTS ONLY public."CashMovement" DROP CONSTRAINT IF EXISTS "CashMovement_branchId_fkey";
ALTER TABLE IF EXISTS ONLY public."CashMovement" DROP CONSTRAINT IF EXISTS "CashMovement_actorUserId_fkey";
ALTER TABLE IF EXISTS ONLY public."Branch" DROP CONSTRAINT IF EXISTS "Branch_businessId_fkey";
ALTER TABLE IF EXISTS ONLY public."AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_businessId_fkey";
ALTER TABLE IF EXISTS ONLY public."AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_branchId_fkey";
ALTER TABLE IF EXISTS ONLY public."AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_actorUserId_fkey";
ALTER TABLE IF EXISTS ONLY public."AnalyticsEvent" DROP CONSTRAINT IF EXISTS "AnalyticsEvent_leadSourceId_fkey";
ALTER TABLE IF EXISTS ONLY public."AnalyticsEvent" DROP CONSTRAINT IF EXISTS "AnalyticsEvent_businessId_fkey";
ALTER TABLE IF EXISTS ONLY public."AnalyticsEvent" DROP CONSTRAINT IF EXISTS "AnalyticsEvent_branchId_fkey";
ALTER TABLE IF EXISTS ONLY public."Address" DROP CONSTRAINT IF EXISTS "Address_customerId_fkey";
ALTER TABLE IF EXISTS ONLY public."Address" DROP CONSTRAINT IF EXISTS "Address_businessId_fkey";
DROP INDEX IF EXISTS public."User_businessId_role_idx";
DROP INDEX IF EXISTS public."User_businessId_email_key";
DROP INDEX IF EXISTS public."StockMovement_businessId_sourceType_sourceId_idx";
DROP INDEX IF EXISTS public."StockMovement_businessId_branchId_productId_createdAt_idx";
DROP INDEX IF EXISTS public."Session_userId_idx";
DROP INDEX IF EXISTS public."Session_tokenHash_key";
DROP INDEX IF EXISTS public."Session_expiresAt_idx";
DROP INDEX IF EXISTS public."Product_businessId_slug_key";
DROP INDEX IF EXISTS public."Product_businessId_isActive_idx";
DROP INDEX IF EXISTS public."Product_businessId_categoryId_idx";
DROP INDEX IF EXISTS public."ProductPrice_businessId_productId_startsAt_idx";
DROP INDEX IF EXISTS public."ProductCategory_businessId_slug_key";
DROP INDEX IF EXISTS public."ProductCategory_businessId_isActive_sortOrder_idx";
DROP INDEX IF EXISTS public."ProductBranchAvailability_businessId_productId_idx";
DROP INDEX IF EXISTS public."ProductBranchAvailability_businessId_branchId_productId_key";
DROP INDEX IF EXISTS public."ProductBranchAvailability_businessId_branchId_isAvailable_idx";
DROP INDEX IF EXISTS public."Payment_businessId_orderId_idx";
DROP INDEX IF EXISTS public."Payment_businessId_cashSessionId_idx";
DROP INDEX IF EXISTS public."Payment_businessId_branchId_createdAt_idx";
DROP INDEX IF EXISTS public."Order_businessId_customerId_createdAt_idx";
DROP INDEX IF EXISTS public."Order_businessId_createdAt_idx";
DROP INDEX IF EXISTS public."Order_businessId_branchId_status_idx";
DROP INDEX IF EXISTS public."OrderStatusHistory_businessId_orderId_createdAt_idx";
DROP INDEX IF EXISTS public."OrderItem_businessId_productId_idx";
DROP INDEX IF EXISTS public."OrderItem_businessId_orderId_idx";
DROP INDEX IF EXISTS public."Lead_businessId_normalizedPhone_key";
DROP INDEX IF EXISTS public."Lead_businessId_leadSourceId_idx";
DROP INDEX IF EXISTS public."Lead_businessId_branchId_createdAt_idx";
DROP INDEX IF EXISTS public."LeadSource_businessId_code_key";
DROP INDEX IF EXISTS public."LeadSource_businessId_branchId_isActive_idx";
DROP INDEX IF EXISTS public."IdempotencyKey_expiresAt_idx";
DROP INDEX IF EXISTS public."IdempotencyKey_businessId_operation_key_key";
DROP INDEX IF EXISTS public."Delivery_orderId_key";
DROP INDEX IF EXISTS public."Delivery_businessId_branchId_status_idx";
DROP INDEX IF EXISTS public."Delivery_businessId_assignedUserId_status_idx";
DROP INDEX IF EXISTS public."DeliveryZone_businessId_branchId_normalizedName_key";
DROP INDEX IF EXISTS public."DeliveryZone_businessId_branchId_isActive_idx";
DROP INDEX IF EXISTS public."Customer_businessId_normalizedPhone_key";
DROP INDEX IF EXISTS public."Customer_businessId_idx";
DROP INDEX IF EXISTS public."CashSession_one_open_per_branch_idx";
DROP INDEX IF EXISTS public."CashSession_businessId_openedAt_idx";
DROP INDEX IF EXISTS public."CashSession_businessId_closedAt_idx";
DROP INDEX IF EXISTS public."CashSession_businessId_branchId_status_idx";
DROP INDEX IF EXISTS public."CashMovement_businessId_cashSessionId_createdAt_idx";
DROP INDEX IF EXISTS public."CashMovement_businessId_branchId_createdAt_idx";
DROP INDEX IF EXISTS public."Branch_businessId_name_key";
DROP INDEX IF EXISTS public."Branch_businessId_idx";
DROP INDEX IF EXISTS public."AuditLog_businessId_entityType_entityId_idx";
DROP INDEX IF EXISTS public."AuditLog_businessId_createdAt_idx";
DROP INDEX IF EXISTS public."AnalyticsEvent_businessId_leadSourceId_occurredAt_idx";
DROP INDEX IF EXISTS public."AnalyticsEvent_businessId_eventType_occurredAt_idx";
DROP INDEX IF EXISTS public."AnalyticsEvent_businessId_branchId_occurredAt_idx";
DROP INDEX IF EXISTS public."AnalyticsEvent_businessId_anonymousId_occurredAt_idx";
DROP INDEX IF EXISTS public."Address_businessId_neighborhood_idx";
DROP INDEX IF EXISTS public."Address_businessId_customerId_idx";
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_pkey";
ALTER TABLE IF EXISTS ONLY public."UserBranchAccess" DROP CONSTRAINT IF EXISTS "UserBranchAccess_pkey";
ALTER TABLE IF EXISTS ONLY public."StockMovement" DROP CONSTRAINT IF EXISTS "StockMovement_pkey";
ALTER TABLE IF EXISTS ONLY public."Session" DROP CONSTRAINT IF EXISTS "Session_pkey";
ALTER TABLE IF EXISTS ONLY public."Product" DROP CONSTRAINT IF EXISTS "Product_pkey";
ALTER TABLE IF EXISTS ONLY public."ProductPrice" DROP CONSTRAINT IF EXISTS "ProductPrice_pkey";
ALTER TABLE IF EXISTS ONLY public."ProductCategory" DROP CONSTRAINT IF EXISTS "ProductCategory_pkey";
ALTER TABLE IF EXISTS ONLY public."ProductBranchAvailability" DROP CONSTRAINT IF EXISTS "ProductBranchAvailability_pkey";
ALTER TABLE IF EXISTS ONLY public."Payment" DROP CONSTRAINT IF EXISTS "Payment_pkey";
ALTER TABLE IF EXISTS ONLY public."Order" DROP CONSTRAINT IF EXISTS "Order_pkey";
ALTER TABLE IF EXISTS ONLY public."OrderStatusHistory" DROP CONSTRAINT IF EXISTS "OrderStatusHistory_pkey";
ALTER TABLE IF EXISTS ONLY public."OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_pkey";
ALTER TABLE IF EXISTS ONLY public."Lead" DROP CONSTRAINT IF EXISTS "Lead_pkey";
ALTER TABLE IF EXISTS ONLY public."LeadSource" DROP CONSTRAINT IF EXISTS "LeadSource_pkey";
ALTER TABLE IF EXISTS ONLY public."IdempotencyKey" DROP CONSTRAINT IF EXISTS "IdempotencyKey_pkey";
ALTER TABLE IF EXISTS ONLY public."Delivery" DROP CONSTRAINT IF EXISTS "Delivery_pkey";
ALTER TABLE IF EXISTS ONLY public."DeliveryZone" DROP CONSTRAINT IF EXISTS "DeliveryZone_pkey";
ALTER TABLE IF EXISTS ONLY public."Customer" DROP CONSTRAINT IF EXISTS "Customer_pkey";
ALTER TABLE IF EXISTS ONLY public."CashSession" DROP CONSTRAINT IF EXISTS "CashSession_pkey";
ALTER TABLE IF EXISTS ONLY public."CashMovement" DROP CONSTRAINT IF EXISTS "CashMovement_pkey";
ALTER TABLE IF EXISTS ONLY public."Business" DROP CONSTRAINT IF EXISTS "Business_pkey";
ALTER TABLE IF EXISTS ONLY public."Branch" DROP CONSTRAINT IF EXISTS "Branch_pkey";
ALTER TABLE IF EXISTS ONLY public."AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_pkey";
ALTER TABLE IF EXISTS ONLY public."AnalyticsEvent" DROP CONSTRAINT IF EXISTS "AnalyticsEvent_pkey";
ALTER TABLE IF EXISTS ONLY public."Address" DROP CONSTRAINT IF EXISTS "Address_pkey";
DROP TABLE IF EXISTS public._prisma_migrations;
DROP TABLE IF EXISTS public."UserBranchAccess";
DROP TABLE IF EXISTS public."User";
DROP TABLE IF EXISTS public."StockMovement";
DROP TABLE IF EXISTS public."Session";
DROP TABLE IF EXISTS public."ProductPrice";
DROP TABLE IF EXISTS public."ProductCategory";
DROP TABLE IF EXISTS public."ProductBranchAvailability";
DROP TABLE IF EXISTS public."Product";
DROP TABLE IF EXISTS public."Payment";
DROP TABLE IF EXISTS public."OrderStatusHistory";
DROP TABLE IF EXISTS public."OrderItem";
DROP TABLE IF EXISTS public."Order";
DROP TABLE IF EXISTS public."LeadSource";
DROP TABLE IF EXISTS public."Lead";
DROP TABLE IF EXISTS public."IdempotencyKey";
DROP TABLE IF EXISTS public."DeliveryZone";
DROP TABLE IF EXISTS public."Delivery";
DROP TABLE IF EXISTS public."Customer";
DROP TABLE IF EXISTS public."CashSession";
DROP TABLE IF EXISTS public."CashMovement";
DROP TABLE IF EXISTS public."Business";
DROP TABLE IF EXISTS public."Branch";
DROP TABLE IF EXISTS public."AuditLog";
DROP TABLE IF EXISTS public."AnalyticsEvent";
DROP TABLE IF EXISTS public."Address";
DROP TYPE IF EXISTS public."StockMovementType";
DROP TYPE IF EXISTS public."SalesChannel";
DROP TYPE IF EXISTS public."PriceBasis";
DROP TYPE IF EXISTS public."PaymentMethod";
DROP TYPE IF EXISTS public."OrderStatus";
DROP TYPE IF EXISTS public."MeasurementType";
DROP TYPE IF EXISTS public."InternalRole";
DROP TYPE IF EXISTS public."FulfillmentType";
DROP TYPE IF EXISTS public."DeliveryStatus";
DROP TYPE IF EXISTS public."CashSessionStatus";
DROP TYPE IF EXISTS public."CashMovementType";
DROP TYPE IF EXISTS public."BaseUnit";
DROP TYPE IF EXISTS public."AuditAction";
DROP TYPE IF EXISTS public."AnalyticsEventType";
--
-- Name: AnalyticsEventType; Type: TYPE; Schema: public; Owner: deliveryreg
--

CREATE TYPE public."AnalyticsEventType" AS ENUM (
    'catalog_viewed',
    'product_viewed',
    'product_added',
    'cart_viewed',
    'checkout_started',
    'lead_created',
    'order_created',
    'order_completed'
);


ALTER TYPE public."AnalyticsEventType" OWNER TO deliveryreg;

--
-- Name: AuditAction; Type: TYPE; Schema: public; Owner: deliveryreg
--

CREATE TYPE public."AuditAction" AS ENUM (
    'PRICE_CHANGED',
    'STOCK_ADJUSTED',
    'ORDER_CANCELLED',
    'WEIGHT_CONFIRMED',
    'ADMIN_CHANGED',
    'PERMISSION_CHANGED',
    'STOCK_TRANSFERRED',
    'PAYMENT_RECORDED',
    'ORDER_COMPLETED',
    'DELIVERY_ASSIGNED',
    'DELIVERY_REASSIGNED',
    'CASH_SESSION_OPENED',
    'CASH_SUPPLY_CREATED',
    'CASH_WITHDRAWAL_CREATED',
    'CASH_SESSION_CLOSED'
);


ALTER TYPE public."AuditAction" OWNER TO deliveryreg;

--
-- Name: BaseUnit; Type: TYPE; Schema: public; Owner: deliveryreg
--

CREATE TYPE public."BaseUnit" AS ENUM (
    'GRAM',
    'UNIT',
    'PACKAGE',
    'MILLILITER',
    'BOX'
);


ALTER TYPE public."BaseUnit" OWNER TO deliveryreg;

--
-- Name: CashMovementType; Type: TYPE; Schema: public; Owner: deliveryreg
--

CREATE TYPE public."CashMovementType" AS ENUM (
    'SUPPLY',
    'WITHDRAWAL'
);


ALTER TYPE public."CashMovementType" OWNER TO deliveryreg;

--
-- Name: CashSessionStatus; Type: TYPE; Schema: public; Owner: deliveryreg
--

CREATE TYPE public."CashSessionStatus" AS ENUM (
    'OPEN',
    'CLOSED'
);


ALTER TYPE public."CashSessionStatus" OWNER TO deliveryreg;

--
-- Name: DeliveryStatus; Type: TYPE; Schema: public; Owner: deliveryreg
--

CREATE TYPE public."DeliveryStatus" AS ENUM (
    'ASSIGNED',
    'PICKED_UP',
    'ON_ROUTE',
    'DELIVERED',
    'FAILED'
);


ALTER TYPE public."DeliveryStatus" OWNER TO deliveryreg;

--
-- Name: FulfillmentType; Type: TYPE; Schema: public; Owner: deliveryreg
--

CREATE TYPE public."FulfillmentType" AS ENUM (
    'PICKUP',
    'DELIVERY'
);


ALTER TYPE public."FulfillmentType" OWNER TO deliveryreg;

--
-- Name: InternalRole; Type: TYPE; Schema: public; Owner: deliveryreg
--

CREATE TYPE public."InternalRole" AS ENUM (
    'OWNER',
    'MANAGER',
    'ATTENDANT',
    'DELIVERY'
);


ALTER TYPE public."InternalRole" OWNER TO deliveryreg;

--
-- Name: MeasurementType; Type: TYPE; Schema: public; Owner: deliveryreg
--

CREATE TYPE public."MeasurementType" AS ENUM (
    'WEIGHT',
    'UNIT',
    'PACKAGE',
    'VOLUME',
    'BOX'
);


ALTER TYPE public."MeasurementType" OWNER TO deliveryreg;

--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: deliveryreg
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'CREATED',
    'ACCEPTED',
    'PREPARING',
    'READY',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."OrderStatus" OWNER TO deliveryreg;

--
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: deliveryreg
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'CASH',
    'PIX',
    'DEBIT_CARD',
    'CREDIT_CARD'
);


ALTER TYPE public."PaymentMethod" OWNER TO deliveryreg;

--
-- Name: PriceBasis; Type: TYPE; Schema: public; Owner: deliveryreg
--

CREATE TYPE public."PriceBasis" AS ENUM (
    'PER_BASE_UNIT',
    'PER_PACKAGE'
);


ALTER TYPE public."PriceBasis" OWNER TO deliveryreg;

--
-- Name: SalesChannel; Type: TYPE; Schema: public; Owner: deliveryreg
--

CREATE TYPE public."SalesChannel" AS ENUM (
    'DIGITAL',
    'POS'
);


ALTER TYPE public."SalesChannel" OWNER TO deliveryreg;

--
-- Name: StockMovementType; Type: TYPE; Schema: public; Owner: deliveryreg
--

CREATE TYPE public."StockMovementType" AS ENUM (
    'PURCHASE',
    'SALE',
    'LOSS',
    'ADJUSTMENT',
    'TRANSFER',
    'RETURN'
);


ALTER TYPE public."StockMovementType" OWNER TO deliveryreg;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Address; Type: TABLE; Schema: public; Owner: deliveryreg
--

CREATE TABLE public."Address" (
    id text NOT NULL,
    "businessId" text NOT NULL,
    "customerId" text NOT NULL,
    label text,
    street text NOT NULL,
    number text NOT NULL,
    neighborhood text NOT NULL,
    reference text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Address" OWNER TO deliveryreg;

--
-- Name: AnalyticsEvent; Type: TABLE; Schema: public; Owner: deliveryreg
--

CREATE TABLE public."AnalyticsEvent" (
    id text NOT NULL,
    "businessId" text NOT NULL,
    "branchId" text,
    "leadSourceId" text,
    "anonymousId" text NOT NULL,
    "eventType" public."AnalyticsEventType" NOT NULL,
    "productId" text,
    "orderId" text,
    "occurredAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    metadata jsonb
);


ALTER TABLE public."AnalyticsEvent" OWNER TO deliveryreg;

--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: deliveryreg
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    "businessId" text NOT NULL,
    "branchId" text,
    "actorUserId" text,
    action public."AuditAction" NOT NULL,
    "entityType" text NOT NULL,
    "entityId" text NOT NULL,
    before jsonb,
    after jsonb,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AuditLog" OWNER TO deliveryreg;

--
-- Name: Branch; Type: TABLE; Schema: public; Owner: deliveryreg
--

CREATE TABLE public."Branch" (
    id text NOT NULL,
    "businessId" text NOT NULL,
    name text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Branch" OWNER TO deliveryreg;

--
-- Name: Business; Type: TABLE; Schema: public; Owner: deliveryreg
--

CREATE TABLE public."Business" (
    id text NOT NULL,
    name text NOT NULL,
    timezone text DEFAULT 'America/Manaus'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Business" OWNER TO deliveryreg;

--
-- Name: CashMovement; Type: TABLE; Schema: public; Owner: deliveryreg
--

CREATE TABLE public."CashMovement" (
    id text NOT NULL,
    "businessId" text NOT NULL,
    "branchId" text NOT NULL,
    "cashSessionId" text NOT NULL,
    "actorUserId" text NOT NULL,
    type public."CashMovementType" NOT NULL,
    "amountCents" integer NOT NULL,
    reason text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "CashMovement_amountCents_check" CHECK (("amountCents" > 0))
);


ALTER TABLE public."CashMovement" OWNER TO deliveryreg;

--
-- Name: CashSession; Type: TABLE; Schema: public; Owner: deliveryreg
--

CREATE TABLE public."CashSession" (
    id text NOT NULL,
    "businessId" text NOT NULL,
    "branchId" text NOT NULL,
    "openedByUserId" text NOT NULL,
    "openedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "openingAmountCents" integer NOT NULL,
    status public."CashSessionStatus" DEFAULT 'OPEN'::public."CashSessionStatus" NOT NULL,
    "closedByUserId" text,
    "closedAt" timestamp(3) without time zone,
    "expectedCashCents" integer,
    "countedCashCents" integer,
    "differenceCents" integer,
    "closingNote" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    CONSTRAINT "CashSession_countedCashCents_check" CHECK ((("countedCashCents" IS NULL) OR ("countedCashCents" >= 0))),
    CONSTRAINT "CashSession_expectedCashCents_check" CHECK ((("expectedCashCents" IS NULL) OR ("expectedCashCents" >= 0))),
    CONSTRAINT "CashSession_openingAmountCents_check" CHECK (("openingAmountCents" >= 0))
);


ALTER TABLE public."CashSession" OWNER TO deliveryreg;

--
-- Name: Customer; Type: TABLE; Schema: public; Owner: deliveryreg
--

CREATE TABLE public."Customer" (
    id text NOT NULL,
    "businessId" text NOT NULL,
    name text NOT NULL,
    phone text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "normalizedPhone" text
);


ALTER TABLE public."Customer" OWNER TO deliveryreg;

--
-- Name: Delivery; Type: TABLE; Schema: public; Owner: deliveryreg
--

CREATE TABLE public."Delivery" (
    id text NOT NULL,
    "businessId" text NOT NULL,
    "branchId" text NOT NULL,
    "orderId" text NOT NULL,
    "addressId" text NOT NULL,
    "assignedUserId" text,
    status public."DeliveryStatus" DEFAULT 'ASSIGNED'::public."DeliveryStatus" NOT NULL,
    "feeCents" integer NOT NULL,
    "assignedAt" timestamp(3) without time zone,
    "pickedUpAt" timestamp(3) without time zone,
    "onRouteAt" timestamp(3) without time zone,
    "deliveredAt" timestamp(3) without time zone,
    "failedAt" timestamp(3) without time zone,
    "failureReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Delivery" OWNER TO deliveryreg;

--
-- Name: DeliveryZone; Type: TABLE; Schema: public; Owner: deliveryreg
--

CREATE TABLE public."DeliveryZone" (
    id text NOT NULL,
    "businessId" text NOT NULL,
    "branchId" text NOT NULL,
    name text NOT NULL,
    "normalizedName" text NOT NULL,
    "feeCents" integer NOT NULL,
    "minimumOrderCents" integer NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DeliveryZone" OWNER TO deliveryreg;

--
-- Name: IdempotencyKey; Type: TABLE; Schema: public; Owner: deliveryreg
--

CREATE TABLE public."IdempotencyKey" (
    id text NOT NULL,
    "businessId" text NOT NULL,
    key text NOT NULL,
    operation text NOT NULL,
    "requestHash" text NOT NULL,
    "responseJson" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."IdempotencyKey" OWNER TO deliveryreg;

--
-- Name: Lead; Type: TABLE; Schema: public; Owner: deliveryreg
--

CREATE TABLE public."Lead" (
    id text NOT NULL,
    "businessId" text NOT NULL,
    "branchId" text,
    "leadSourceId" text,
    "customerId" text,
    name text NOT NULL,
    whatsapp text NOT NULL,
    "normalizedPhone" text NOT NULL,
    "firstSeenAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastSeenAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Lead" OWNER TO deliveryreg;

--
-- Name: LeadSource; Type: TABLE; Schema: public; Owner: deliveryreg
--

CREATE TABLE public."LeadSource" (
    id text NOT NULL,
    "businessId" text NOT NULL,
    "branchId" text,
    code text NOT NULL,
    label text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."LeadSource" OWNER TO deliveryreg;

--
-- Name: Order; Type: TABLE; Schema: public; Owner: deliveryreg
--

CREATE TABLE public."Order" (
    id text NOT NULL,
    "businessId" text NOT NULL,
    "branchId" text NOT NULL,
    "customerId" text,
    status public."OrderStatus" DEFAULT 'CREATED'::public."OrderStatus" NOT NULL,
    "subtotalCents" integer DEFAULT 0 NOT NULL,
    "totalCents" integer DEFAULT 0 NOT NULL,
    "createdByUserId" text,
    "completedAt" timestamp(3) without time zone,
    "cancelledAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "leadId" text,
    "leadSourceId" text,
    "fulfillmentType" public."FulfillmentType" DEFAULT 'PICKUP'::public."FulfillmentType" NOT NULL,
    "salesChannel" public."SalesChannel" DEFAULT 'DIGITAL'::public."SalesChannel" NOT NULL
);


ALTER TABLE public."Order" OWNER TO deliveryreg;

--
-- Name: OrderItem; Type: TABLE; Schema: public; Owner: deliveryreg
--

CREATE TABLE public."OrderItem" (
    id text NOT NULL,
    "businessId" text NOT NULL,
    "orderId" text NOT NULL,
    "productId" text NOT NULL,
    "productNameSnapshot" text NOT NULL,
    "measurementTypeSnapshot" public."MeasurementType" NOT NULL,
    "requestedQuantity" integer NOT NULL,
    "actualQuantity" integer,
    "priceCentsSnapshot" integer NOT NULL,
    "priceBasisQuantitySnapshot" integer NOT NULL,
    "priceBasisUnitSnapshot" public."BaseUnit" NOT NULL,
    "estimatedAmountCents" integer NOT NULL,
    "finalAmountCents" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."OrderItem" OWNER TO deliveryreg;

--
-- Name: OrderStatusHistory; Type: TABLE; Schema: public; Owner: deliveryreg
--

CREATE TABLE public."OrderStatusHistory" (
    id text NOT NULL,
    "businessId" text NOT NULL,
    "orderId" text NOT NULL,
    "actorUserId" text,
    "fromStatus" public."OrderStatus",
    "toStatus" public."OrderStatus" NOT NULL,
    reason text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."OrderStatusHistory" OWNER TO deliveryreg;

--
-- Name: Payment; Type: TABLE; Schema: public; Owner: deliveryreg
--

CREATE TABLE public."Payment" (
    id text NOT NULL,
    "businessId" text NOT NULL,
    "branchId" text NOT NULL,
    "orderId" text NOT NULL,
    "actorUserId" text,
    method public."PaymentMethod" NOT NULL,
    "amountCents" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "cashSessionId" text
);


ALTER TABLE public."Payment" OWNER TO deliveryreg;

--
-- Name: Product; Type: TABLE; Schema: public; Owner: deliveryreg
--

CREATE TABLE public."Product" (
    id text NOT NULL,
    "businessId" text NOT NULL,
    name text NOT NULL,
    "measurementType" public."MeasurementType" NOT NULL,
    "baseUnit" public."BaseUnit" NOT NULL,
    "sellingIncrement" integer NOT NULL,
    "minimumOrderQuantity" integer NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "categoryId" text,
    slug text NOT NULL,
    description text,
    "imageUrl" text
);


ALTER TABLE public."Product" OWNER TO deliveryreg;

--
-- Name: ProductBranchAvailability; Type: TABLE; Schema: public; Owner: deliveryreg
--

CREATE TABLE public."ProductBranchAvailability" (
    id text NOT NULL,
    "businessId" text NOT NULL,
    "branchId" text NOT NULL,
    "productId" text NOT NULL,
    "isAvailable" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ProductBranchAvailability" OWNER TO deliveryreg;

--
-- Name: ProductCategory; Type: TABLE; Schema: public; Owner: deliveryreg
--

CREATE TABLE public."ProductCategory" (
    id text NOT NULL,
    "businessId" text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ProductCategory" OWNER TO deliveryreg;

--
-- Name: ProductPrice; Type: TABLE; Schema: public; Owner: deliveryreg
--

CREATE TABLE public."ProductPrice" (
    id text NOT NULL,
    "businessId" text NOT NULL,
    "productId" text NOT NULL,
    "priceCents" integer NOT NULL,
    "basisQuantity" integer NOT NULL,
    "basisUnit" public."BaseUnit" NOT NULL,
    "priceBasis" public."PriceBasis" DEFAULT 'PER_BASE_UNIT'::public."PriceBasis" NOT NULL,
    "startsAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "endsAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ProductPrice" OWNER TO deliveryreg;

--
-- Name: Session; Type: TABLE; Schema: public; Owner: deliveryreg
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "tokenHash" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "revokedAt" timestamp(3) without time zone
);


ALTER TABLE public."Session" OWNER TO deliveryreg;

--
-- Name: StockMovement; Type: TABLE; Schema: public; Owner: deliveryreg
--

CREATE TABLE public."StockMovement" (
    id text NOT NULL,
    "businessId" text NOT NULL,
    "branchId" text NOT NULL,
    "productId" text NOT NULL,
    "actorUserId" text,
    type public."StockMovementType" NOT NULL,
    "quantityDelta" integer NOT NULL,
    reason text NOT NULL,
    "sourceType" text,
    "sourceId" text,
    "idempotencyKeyId" text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."StockMovement" OWNER TO deliveryreg;

--
-- Name: User; Type: TABLE; Schema: public; Owner: deliveryreg
--

CREATE TABLE public."User" (
    id text NOT NULL,
    "businessId" text NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    "passwordHash" text NOT NULL,
    role public."InternalRole" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO deliveryreg;

--
-- Name: UserBranchAccess; Type: TABLE; Schema: public; Owner: deliveryreg
--

CREATE TABLE public."UserBranchAccess" (
    "userId" text NOT NULL,
    "branchId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."UserBranchAccess" OWNER TO deliveryreg;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: deliveryreg
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO deliveryreg;

--
-- Data for Name: Address; Type: TABLE DATA; Schema: public; Owner: deliveryreg
--

COPY public."Address" (id, "businessId", "customerId", label, street, number, neighborhood, reference, "createdAt", "updatedAt") FROM stdin;
cmtbvfcje002dfdoz57kduazi	business_deliveryreg_manaus	cmtbvfcic0029fdozlqtvw0mf	\N	Rua Teste	100	Centro	Casa	2026-08-27 18:43:29.979	2026-08-27 18:43:29.979
cmtbvge5r003bfdoz93kzecj5	business_deliveryreg_manaus	cmtbvfcic0029fdozlqtvw0mf	\N	Rua Teste	100	Centro	Casa	2026-08-27 18:44:18.736	2026-08-27 18:44:18.736
\.


--
-- Data for Name: AnalyticsEvent; Type: TABLE DATA; Schema: public; Owner: deliveryreg
--

COPY public."AnalyticsEvent" (id, "businessId", "branchId", "leadSourceId", "anonymousId", "eventType", "productId", "orderId", "occurredAt", metadata) FROM stdin;
cmtb6v0j10001fdywvwac2aug	business_deliveryreg_manaus	\N	\N	8aa5fa64-a604-41af-a206-7600a6945d40	catalog_viewed	\N	\N	2026-08-27 07:15:50.509	\N
cmtb6v0jm0003fdyw0tw907b4	business_deliveryreg_manaus	\N	\N	4f34b13c-cc5f-429e-8536-074c8f76c710	catalog_viewed	\N	\N	2026-08-27 07:15:50.511	\N
cmtb8017y0001fd647t7k4jaj	business_deliveryreg_manaus	\N	\N	4f34b13c-cc5f-429e-8536-074c8f76c710	catalog_viewed	\N	\N	2026-08-27 07:47:44.302	\N
cmtb8018c0003fd645lr7oaag	business_deliveryreg_manaus	\N	\N	4f34b13c-cc5f-429e-8536-074c8f76c710	catalog_viewed	\N	\N	2026-08-27 07:47:44.316	\N
cmtbumx140001fdg88mlvvm15	business_deliveryreg_manaus	\N	\N	4f34b13c-cc5f-429e-8536-074c8f76c710	catalog_viewed	\N	\N	2026-08-27 18:21:23.511	\N
cmtbumx1n0003fdg8rh5jandi	business_deliveryreg_manaus	\N	\N	4f34b13c-cc5f-429e-8536-074c8f76c710	catalog_viewed	\N	\N	2026-08-27 18:21:23.512	\N
cmtbv6dbx0001fdozlkibbmdp	business_deliveryreg_manaus	\N	\N	699172ce-90b5-4608-87e5-20ba2006045e	catalog_viewed	\N	\N	2026-08-27 18:36:31.102	\N
cmtbv6dd00003fdozsmasi9sm	business_deliveryreg_manaus	\N	\N	41071f41-8798-4d5d-b492-2d30754c3ce7	catalog_viewed	\N	\N	2026-08-27 18:36:31.14	\N
cmtbv6e860005fdoz1ftzhxxb	business_deliveryreg_manaus	\N	\N	41071f41-8798-4d5d-b492-2d30754c3ce7	product_added	cmtauej8i000hfdfguqlz972n	\N	2026-08-27 18:36:32.262	\N
cmtbv6etz0007fdozzwqrxwwn	business_deliveryreg_manaus	\N	\N	41071f41-8798-4d5d-b492-2d30754c3ce7	cart_viewed	\N	\N	2026-08-27 18:36:33.048	\N
cmtbv6euu0009fdozvsijbqot	business_deliveryreg_manaus	\N	\N	41071f41-8798-4d5d-b492-2d30754c3ce7	cart_viewed	\N	\N	2026-08-27 18:36:33.078	\N
cmtbv7duc000bfdozveljm5hg	business_deliveryreg_manaus	\N	\N	d913efc8-cbdd-44a4-802e-873b7a41cf07	catalog_viewed	\N	\N	2026-08-27 18:37:18.42	\N
cmtbv7dvw000dfdoz3a2oxam2	business_deliveryreg_manaus	\N	\N	6a9a52a7-530c-49b3-9b2f-c27850e6b819	catalog_viewed	\N	\N	2026-08-27 18:37:18.477	\N
cmtbv7e4o000ffdozsb611er2	business_deliveryreg_manaus	\N	\N	6a9a52a7-530c-49b3-9b2f-c27850e6b819	product_added	cmtauej8i000hfdfguqlz972n	\N	2026-08-27 18:37:18.793	\N
cmtbv7ewi000jfdozdu0m9wqc	business_deliveryreg_manaus	\N	\N	6a9a52a7-530c-49b3-9b2f-c27850e6b819	cart_viewed	\N	\N	2026-08-27 18:37:19.794	\N
cmtbv7ewh000hfdozadpswubu	business_deliveryreg_manaus	\N	\N	6a9a52a7-530c-49b3-9b2f-c27850e6b819	cart_viewed	\N	\N	2026-08-27 18:37:19.793	\N
cmtbv8hgh000lfdoz2j0xb0lz	business_deliveryreg_manaus	\N	\N	10456adb-581e-4b88-9eab-6ad78b3bc6f7	catalog_viewed	\N	\N	2026-08-27 18:38:09.762	\N
cmtbv8hhv000nfdozhi2v6be3	business_deliveryreg_manaus	\N	\N	263f105f-8b77-4829-851f-264ce75f6681	catalog_viewed	\N	\N	2026-08-27 18:38:09.811	\N
cmtbv8i9y000pfdozna0y8j0c	business_deliveryreg_manaus	\N	\N	263f105f-8b77-4829-851f-264ce75f6681	product_added	cmtauej8i000hfdfguqlz972n	\N	2026-08-27 18:38:10.823	\N
cmtbv8iyc000rfdozxp8n2194	business_deliveryreg_manaus	\N	\N	263f105f-8b77-4829-851f-264ce75f6681	cart_viewed	\N	\N	2026-08-27 18:38:11.7	\N
cmtbv8iyz000tfdozjvxq0jwa	business_deliveryreg_manaus	\N	\N	263f105f-8b77-4829-851f-264ce75f6681	cart_viewed	\N	\N	2026-08-27 18:38:11.723	\N
cmtbv8ji2000vfdoztkv3j02c	business_deliveryreg_manaus	\N	\N	263f105f-8b77-4829-851f-264ce75f6681	checkout_started	\N	\N	2026-08-27 18:38:12.41	\N
cmtbv8keo0017fdozeu13kvw6	business_deliveryreg_manaus	cmtauehfd0003fdfgawgmpd1c	\N	263f105f-8b77-4829-851f-264ce75f6681	order_created	\N	cmtbv8kdu0013fdozdo36aesp	2026-08-27 18:38:13.585	\N
cmtbv8o1k0019fdoz2f90mzuu	business_deliveryreg_manaus	\N	\N	263f105f-8b77-4829-851f-264ce75f6681	catalog_viewed	\N	\N	2026-08-27 18:38:18.297	\N
cmtbv8o1u001bfdozxaknz2vs	business_deliveryreg_manaus	\N	\N	263f105f-8b77-4829-851f-264ce75f6681	catalog_viewed	\N	\N	2026-08-27 18:38:18.306	\N
cmtbv8ow9001dfdozpso410w5	business_deliveryreg_manaus	\N	\N	263f105f-8b77-4829-851f-264ce75f6681	cart_viewed	\N	\N	2026-08-27 18:38:19.401	\N
cmtbv8owd001ffdoze6qlsh49	business_deliveryreg_manaus	\N	\N	263f105f-8b77-4829-851f-264ce75f6681	cart_viewed	\N	\N	2026-08-27 18:38:19.405	\N
cmtbv8pbd001hfdozr9oot85v	business_deliveryreg_manaus	\N	\N	263f105f-8b77-4829-851f-264ce75f6681	cart_viewed	\N	\N	2026-08-27 18:38:19.946	\N
cmtbv8pc4001jfdozk4md19hp	business_deliveryreg_manaus	\N	\N	263f105f-8b77-4829-851f-264ce75f6681	cart_viewed	\N	\N	2026-08-27 18:38:19.972	\N
cmtbv8qfi001lfdozerdsfct7	business_deliveryreg_manaus	\N	\N	263f105f-8b77-4829-851f-264ce75f6681	catalog_viewed	\N	\N	2026-08-27 18:38:21.39	\N
cmtbv8qg6001nfdozjawgdy0a	business_deliveryreg_manaus	\N	\N	263f105f-8b77-4829-851f-264ce75f6681	catalog_viewed	\N	\N	2026-08-27 18:38:21.414	\N
cmtbv8qi9001pfdozmpz6vkdu	business_deliveryreg_manaus	\N	\N	263f105f-8b77-4829-851f-264ce75f6681	product_added	cmtauej8i000hfdfguqlz972n	\N	2026-08-27 18:38:21.489	\N
cmtbv8qt3001rfdoze3dj3irw	business_deliveryreg_manaus	\N	\N	263f105f-8b77-4829-851f-264ce75f6681	cart_viewed	\N	\N	2026-08-27 18:38:21.879	\N
cmtbv8qud001tfdozqx9q5juv	business_deliveryreg_manaus	\N	\N	263f105f-8b77-4829-851f-264ce75f6681	cart_viewed	\N	\N	2026-08-27 18:38:21.925	\N
cmtbvfba9001vfdoz7i2udpju	business_deliveryreg_manaus	\N	\N	671e678f-ae12-4ee7-8258-0ebd622d5e69	catalog_viewed	\N	\N	2026-08-27 18:43:28.354	\N
cmtbvfbar001xfdoznh3as4aq	business_deliveryreg_manaus	\N	\N	6f36bfb2-80a3-43a7-9ecb-b1980cf309b8	catalog_viewed	\N	\N	2026-08-27 18:43:28.371	\N
cmtbvfbup001zfdozm0jgzko0	business_deliveryreg_manaus	\N	\N	6f36bfb2-80a3-43a7-9ecb-b1980cf309b8	product_added	cmtauej8i000hfdfguqlz972n	\N	2026-08-27 18:43:29.089	\N
cmtbvfc6k0021fdozc2yixb7t	business_deliveryreg_manaus	\N	\N	6f36bfb2-80a3-43a7-9ecb-b1980cf309b8	cart_viewed	\N	\N	2026-08-27 18:43:29.516	\N
cmtbvfc7r0023fdozda5zne0a	business_deliveryreg_manaus	\N	\N	6f36bfb2-80a3-43a7-9ecb-b1980cf309b8	cart_viewed	\N	\N	2026-08-27 18:43:29.509	\N
cmtbvfcgy0025fdoz7qs19z5t	business_deliveryreg_manaus	\N	\N	6f36bfb2-80a3-43a7-9ecb-b1980cf309b8	checkout_started	\N	\N	2026-08-27 18:43:29.891	\N
cmtbvfck6002lfdozs0fwlkiz	business_deliveryreg_manaus	cmtauehfd0003fdfgawgmpd1c	\N	6f36bfb2-80a3-43a7-9ecb-b1980cf309b8	order_created	\N	cmtbvfcjl002ffdozw0gowncx	2026-08-27 18:43:30.006	\N
cmtbvfd3q002nfdozr2pwag8g	business_deliveryreg_manaus	\N	\N	6f36bfb2-80a3-43a7-9ecb-b1980cf309b8	catalog_viewed	\N	\N	2026-08-27 18:43:30.71	\N
cmtbvfd43002pfdozlqluzcz7	business_deliveryreg_manaus	\N	\N	6f36bfb2-80a3-43a7-9ecb-b1980cf309b8	catalog_viewed	\N	\N	2026-08-27 18:43:30.723	\N
cmtbvfd57002rfdoze9qm17bp	business_deliveryreg_manaus	\N	\N	6f36bfb2-80a3-43a7-9ecb-b1980cf309b8	product_added	cmtauej8i000hfdfguqlz972n	\N	2026-08-27 18:43:30.763	\N
cmtbvgd77002tfdoz78xgzwme	business_deliveryreg_manaus	\N	\N	3950c3b4-bf18-4e14-9269-73b674e06284	catalog_viewed	\N	\N	2026-08-27 18:44:17.491	\N
cmtbvgd7v002vfdozhutpt50c	business_deliveryreg_manaus	\N	\N	bb2dca8a-c0e6-4dd0-9413-631f05c9457f	catalog_viewed	\N	\N	2026-08-27 18:44:17.516	\N
cmtbvgdn4002xfdozcrf6lq7b	business_deliveryreg_manaus	\N	\N	bb2dca8a-c0e6-4dd0-9413-631f05c9457f	product_added	cmtauej8i000hfdfguqlz972n	\N	2026-08-27 18:44:18.064	\N
cmtbvgdw4002zfdoz1krpesse	business_deliveryreg_manaus	\N	\N	bb2dca8a-c0e6-4dd0-9413-631f05c9457f	cart_viewed	\N	\N	2026-08-27 18:44:18.389	\N
cmtbvgdwi0031fdozf9t95fww	business_deliveryreg_manaus	\N	\N	bb2dca8a-c0e6-4dd0-9413-631f05c9457f	cart_viewed	\N	\N	2026-08-27 18:44:18.402	\N
cmtbvge490033fdoz97vr66i2	business_deliveryreg_manaus	\N	\N	bb2dca8a-c0e6-4dd0-9413-631f05c9457f	checkout_started	\N	\N	2026-08-27 18:44:18.682	\N
cmtbvge6f003jfdoz9jafy6ob	business_deliveryreg_manaus	cmtauehfd0003fdfgawgmpd1c	\N	bb2dca8a-c0e6-4dd0-9413-631f05c9457f	order_created	\N	cmtbvge5v003dfdoz64k8xj06	2026-08-27 18:44:18.759	\N
cmtbvgesp003lfdoz4f16t261	business_deliveryreg_manaus	cmtauehfd0003fdfgawgmpd1c	cmtauej98000rfdfgrz42dzub	bb2dca8a-c0e6-4dd0-9413-631f05c9457f	catalog_viewed	\N	\N	2026-08-27 18:44:19.56	\N
cmtbvgesz003nfdozmusdjjqs	business_deliveryreg_manaus	cmtauehfd0003fdfgawgmpd1c	cmtauej98000rfdfgrz42dzub	bb2dca8a-c0e6-4dd0-9413-631f05c9457f	catalog_viewed	\N	\N	2026-08-27 18:44:19.572	\N
cmtbvgeuh003pfdozcm0xcvl2	business_deliveryreg_manaus	cmtauehfd0003fdfgawgmpd1c	cmtauej98000rfdfgrz42dzub	bb2dca8a-c0e6-4dd0-9413-631f05c9457f	product_added	cmtauej8i000hfdfguqlz972n	\N	2026-08-27 18:44:19.626	\N
cmtbvh8ml003rfdoz07ju8z18	business_deliveryreg_manaus	cmtauehfd0003fdfgawgmpd1c	cmtauej98000rfdfgrz42dzub	54e54600-4fed-4f64-9553-aeb8d08e28d0	catalog_viewed	\N	\N	2026-08-27 18:44:58.222	\N
cmtbvh8n7003tfdoz33xfvsq7	business_deliveryreg_manaus	cmtauehfd0003fdfgawgmpd1c	cmtauej98000rfdfgrz42dzub	0bd86675-45ac-4c72-b166-a1bc3d289d0d	catalog_viewed	\N	\N	2026-08-27 18:44:58.243	\N
cmtbvh8tl003vfdoz1ntbxdn4	business_deliveryreg_manaus	cmtauehfd0003fdfgawgmpd1c	cmtauej98000rfdfgrz42dzub	0bd86675-45ac-4c72-b166-a1bc3d289d0d	catalog_viewed	\N	\N	2026-08-27 18:44:58.473	\N
cmtbvh8u1003xfdozv0aoa6k9	business_deliveryreg_manaus	cmtauehfd0003fdfgawgmpd1c	cmtauej98000rfdfgrz42dzub	0bd86675-45ac-4c72-b166-a1bc3d289d0d	catalog_viewed	\N	\N	2026-08-27 18:44:58.49	\N
cmtbvh8v0003zfdozw9tpso3k	business_deliveryreg_manaus	cmtauehfd0003fdfgawgmpd1c	cmtauej98000rfdfgrz42dzub	0bd86675-45ac-4c72-b166-a1bc3d289d0d	product_added	cmtauej8i000hfdfguqlz972n	\N	2026-08-27 18:44:58.524	\N
cmtbvh94q0043fdozsrcpz4hw	business_deliveryreg_manaus	cmtauehfd0003fdfgawgmpd1c	cmtauej98000rfdfgrz42dzub	0bd86675-45ac-4c72-b166-a1bc3d289d0d	cart_viewed	\N	\N	2026-08-27 18:44:58.874	\N
cmtbvh94k0041fdozy1kqbi5s	business_deliveryreg_manaus	cmtauehfd0003fdfgawgmpd1c	cmtauej98000rfdfgrz42dzub	0bd86675-45ac-4c72-b166-a1bc3d289d0d	cart_viewed	\N	\N	2026-08-27 18:44:58.868	\N
cmtbxjxeb0001fdom3e7lhulj	business_deliveryreg_manaus	\N	\N	4f34b13c-cc5f-429e-8536-074c8f76c710	catalog_viewed	\N	\N	2026-08-27 19:43:02.868	\N
cmtbxjxew0003fdomuflfvk0t	business_deliveryreg_manaus	\N	\N	4f34b13c-cc5f-429e-8536-074c8f76c710	catalog_viewed	\N	\N	2026-08-27 19:43:02.888	\N
cmtbxk5qu0005fdome691tkhp	business_deliveryreg_manaus	\N	\N	4f34b13c-cc5f-429e-8536-074c8f76c710	product_added	cmtauej8i000hfdfguqlz972n	\N	2026-08-27 19:43:13.686	\N
cmtbxk76w0007fdom5mcprrff	business_deliveryreg_manaus	\N	\N	4f34b13c-cc5f-429e-8536-074c8f76c710	cart_viewed	\N	\N	2026-08-27 19:43:15.56	\N
cmtbxk76z0009fdomyipfwpit	business_deliveryreg_manaus	\N	\N	4f34b13c-cc5f-429e-8536-074c8f76c710	cart_viewed	\N	\N	2026-08-27 19:43:15.563	\N
cmtchf9wc0001fdcy6jvfc2fk	business_deliveryreg_manaus	\N	\N	3c3fab5c-e15f-4111-9458-e06c0603f10a	catalog_viewed	\N	\N	2026-08-28 04:59:18.109	\N
cmtchrq340001fdx3aovnjh4x	business_deliveryreg_manaus	\N	\N	4f34b13c-cc5f-429e-8536-074c8f76c710	catalog_viewed	\N	\N	2026-08-28 05:08:58.96	\N
cmtchrq410003fdx3comjebkg	business_deliveryreg_manaus	\N	\N	4f34b13c-cc5f-429e-8536-074c8f76c710	catalog_viewed	\N	\N	2026-08-28 05:08:58.993	\N
cmtchs6hv0005fdx3vnf0x3uk	business_deliveryreg_manaus	\N	\N	4f34b13c-cc5f-429e-8536-074c8f76c710	product_added	cmtauej8i000hfdfguqlz972n	\N	2026-08-28 05:09:20.228	\N
cmtchs8550007fdx3mxrhy6fq	business_deliveryreg_manaus	\N	\N	4f34b13c-cc5f-429e-8536-074c8f76c710	product_added	cmtchdxvk0015fdl8ee94tk69	\N	2026-08-28 05:09:22.361	\N
cmtchs9a20009fdx3nq3eatw0	business_deliveryreg_manaus	\N	\N	4f34b13c-cc5f-429e-8536-074c8f76c710	product_added	cmtchdxu4000pfdl82il17gtn	\N	2026-08-28 05:09:23.833	\N
cmtchsamj000bfdx34s8vnpfy	business_deliveryreg_manaus	\N	\N	4f34b13c-cc5f-429e-8536-074c8f76c710	cart_viewed	\N	\N	2026-08-28 05:09:25.579	\N
cmtchsamm000dfdx3ezioq7au	business_deliveryreg_manaus	\N	\N	4f34b13c-cc5f-429e-8536-074c8f76c710	cart_viewed	\N	\N	2026-08-28 05:09:25.581	\N
\.


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: deliveryreg
--

COPY public."AuditLog" (id, "businessId", "branchId", "actorUserId", action, "entityType", "entityId", before, after, metadata, "createdAt") FROM stdin;
\.


--
-- Data for Name: Branch; Type: TABLE DATA; Schema: public; Owner: deliveryreg
--

COPY public."Branch" (id, "businessId", name, "isActive", "createdAt", "updatedAt") FROM stdin;
cmtauehfd0003fdfgawgmpd1c	business_deliveryreg_manaus	Alvorada 1	t	2026-08-27 01:27:03.853	2026-08-28 04:58:13.514
cmtauehf10001fdfg58o96yme	business_deliveryreg_manaus	Alvorada 2	t	2026-08-27 01:27:03.853	2026-08-28 04:58:13.515
\.


--
-- Data for Name: Business; Type: TABLE DATA; Schema: public; Owner: deliveryreg
--

COPY public."Business" (id, name, timezone, "createdAt", "updatedAt") FROM stdin;
business_deliveryreg_manaus	DeliveryReg Manaus	America/Manaus	2026-08-27 01:27:03.844	2026-08-27 01:27:03.844
\.


--
-- Data for Name: CashMovement; Type: TABLE DATA; Schema: public; Owner: deliveryreg
--

COPY public."CashMovement" (id, "businessId", "branchId", "cashSessionId", "actorUserId", type, "amountCents", reason, "createdAt") FROM stdin;
\.


--
-- Data for Name: CashSession; Type: TABLE DATA; Schema: public; Owner: deliveryreg
--

COPY public."CashSession" (id, "businessId", "branchId", "openedByUserId", "openedAt", "openingAmountCents", status, "closedByUserId", "closedAt", "expectedCashCents", "countedCashCents", "differenceCents", "closingNote", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Customer; Type: TABLE DATA; Schema: public; Owner: deliveryreg
--

COPY public."Customer" (id, "businessId", name, phone, "createdAt", "updatedAt", "normalizedPhone") FROM stdin;
cmtbv8kcd000zfdoz6bvwatub	business_deliveryreg_manaus	Cliente Teste	92999998888	2026-08-27 18:38:13.501	2026-08-27 18:38:13.501	5592999998888
cmtbvfcic0029fdozlqtvw0mf	business_deliveryreg_manaus	Cliente Entrega	92999997777	2026-08-27 18:43:29.941	2026-08-27 18:44:18.716	5592999997777
\.


--
-- Data for Name: Delivery; Type: TABLE DATA; Schema: public; Owner: deliveryreg
--

COPY public."Delivery" (id, "businessId", "branchId", "orderId", "addressId", "assignedUserId", status, "feeCents", "assignedAt", "pickedUpAt", "onRouteAt", "deliveredAt", "failedAt", "failureReason", "createdAt", "updatedAt") FROM stdin;
cmtbvfcjq002jfdoz0row4mbj	business_deliveryreg_manaus	cmtauehfd0003fdfgawgmpd1c	cmtbvfcjl002ffdozw0gowncx	cmtbvfcje002dfdoz57kduazi	\N	ASSIGNED	800	\N	\N	\N	\N	\N	\N	2026-08-27 18:43:29.991	2026-08-27 18:43:29.991
cmtbvge61003hfdozulm56xjv	business_deliveryreg_manaus	cmtauehfd0003fdfgawgmpd1c	cmtbvge5v003dfdoz64k8xj06	cmtbvge5r003bfdoz93kzecj5	\N	ASSIGNED	800	\N	\N	\N	\N	\N	\N	2026-08-27 18:44:18.746	2026-08-27 18:44:18.746
\.


--
-- Data for Name: DeliveryZone; Type: TABLE DATA; Schema: public; Owner: deliveryreg
--

COPY public."DeliveryZone" (id, "businessId", "branchId", name, "normalizedName", "feeCents", "minimumOrderCents", "isActive", "createdAt", "updatedAt") FROM stdin;
cmtaueja6001afdfg2mlmes01	business_deliveryreg_manaus	cmtauehfd0003fdfgawgmpd1c	Adrianopolis	adrianopolis	800	3000	t	2026-08-27 01:27:06.27	2026-08-27 01:27:06.27
cmtaueja60018fdfgfgz5n1r6	business_deliveryreg_manaus	cmtauehf10001fdfg58o96yme	Centro	centro	800	3000	t	2026-08-27 01:27:06.27	2026-08-27 01:27:06.27
cmtaueja60019fdfgru7bijor	business_deliveryreg_manaus	cmtauehf10001fdfg58o96yme	Adrianopolis	adrianopolis	800	3000	t	2026-08-27 01:27:06.27	2026-08-27 01:27:06.27
cmtaueja6001bfdfglw33up42	business_deliveryreg_manaus	cmtauehfd0003fdfgawgmpd1c	Centro	centro	800	3000	t	2026-08-27 01:27:06.27	2026-08-27 01:27:06.27
cmtchdxzi002jfdl8z02yeeq0	business_deliveryreg_manaus	cmtauehf10001fdfg58o96yme	Alvorada	alvorada	800	3000	t	2026-08-28 04:58:16.014	2026-08-28 04:58:16.014
cmtchdxzh002dfdl8pcqc8pt7	business_deliveryreg_manaus	cmtauehfd0003fdfgawgmpd1c	Dom Pedro	dom-pedro	800	3000	t	2026-08-28 04:58:16.013	2026-08-28 04:58:16.013
cmtchdxzh002cfdl8uov3kbo0	business_deliveryreg_manaus	cmtauehfd0003fdfgawgmpd1c	Alvorada	alvorada	800	3000	t	2026-08-28 04:58:16.013	2026-08-28 04:58:16.013
cmtauejac001ffdfg1idina94	business_deliveryreg_manaus	cmtauehf10001fdfg58o96yme	Ponta Negra	ponta-negra	800	3000	t	2026-08-27 01:27:06.271	2026-08-28 04:58:16.014
cmtaueja7001dfdfg6k01new3	business_deliveryreg_manaus	cmtauehfd0003fdfgawgmpd1c	Ponta Negra	ponta-negra	800	3000	t	2026-08-27 01:27:06.271	2026-08-28 04:58:16.014
cmtchdxzx002lfdl8kh8cknyd	business_deliveryreg_manaus	cmtauehf10001fdfg58o96yme	Dom Pedro	dom-pedro	800	3000	t	2026-08-28 04:58:16.014	2026-08-28 04:58:16.014
\.


--
-- Data for Name: IdempotencyKey; Type: TABLE DATA; Schema: public; Owner: deliveryreg
--

COPY public."IdempotencyKey" (id, "businessId", key, operation, "requestHash", "responseJson", "createdAt", "expiresAt") FROM stdin;
cmtbv8kbw000xfdozxu8n1z40	business_deliveryreg_manaus	1541ba31-c4db-47d9-9191-012320b9caf8	create-pickup-order	0b7606b89f641e6345a18ec3692aa67de3d3dfe5efb80f8175c2b502ffd0a6b5	{"status": "CREATED", "orderId": "cmtbv8kdu0013fdozdo36aesp", "totalCents": 2520}	2026-08-27 18:38:13.484	2026-08-28 18:38:13.483
cmtbvfci40027fdozt5dcj7qz	business_deliveryreg_manaus	eb44c9d2-e8a2-4d86-a4da-19f157b4bab6	create-pickup-order	d8be00bfd052fe6753e5647752b625a07f03747bc55351832ba1f8b5e1824873	{"status": "CREATED", "orderId": "cmtbvfcjl002ffdozw0gowncx", "totalCents": 5000}	2026-08-27 18:43:29.932	2026-08-28 18:43:29.93
cmtbvge520035fdoz3cp6pz6p	business_deliveryreg_manaus	bea3a1e6-00c7-4fd2-a5d9-12f5e1e2e68e	create-pickup-order	d8be00bfd052fe6753e5647752b625a07f03747bc55351832ba1f8b5e1824873	{"status": "CREATED", "orderId": "cmtbvge5v003dfdoz64k8xj06", "totalCents": 5000}	2026-08-27 18:44:18.71	2026-08-28 18:44:18.709
\.


--
-- Data for Name: Lead; Type: TABLE DATA; Schema: public; Owner: deliveryreg
--

COPY public."Lead" (id, "businessId", "branchId", "leadSourceId", "customerId", name, whatsapp, "normalizedPhone", "firstSeenAt", "lastSeenAt", "createdAt", "updatedAt") FROM stdin;
cmtbv8kcm0011fdozkevgokis	business_deliveryreg_manaus	cmtauehfd0003fdfgawgmpd1c	\N	cmtbv8kcd000zfdoz6bvwatub	Cliente Teste	92999998888	5592999998888	2026-08-27 18:38:13.511	2026-08-27 18:38:13.511	2026-08-27 18:38:13.511	2026-08-27 18:38:13.511
cmtbvfcii002bfdozqtkthz4v	business_deliveryreg_manaus	cmtauehfd0003fdfgawgmpd1c	\N	cmtbvfcic0029fdozlqtvw0mf	Cliente Entrega	92999997777	5592999997777	2026-08-27 18:43:29.946	2026-08-27 18:44:18.72	2026-08-27 18:43:29.946	2026-08-27 18:44:18.721
\.


--
-- Data for Name: LeadSource; Type: TABLE DATA; Schema: public; Owner: deliveryreg
--

COPY public."LeadSource" (id, "businessId", "branchId", code, label, "isActive", "createdAt", "updatedAt") FROM stdin;
cmtauej98000qfdfgsewq648s	business_deliveryreg_manaus	cmtauehf10001fdfg58o96yme	qr-ponta-negra-02	QR Code Ponta Negra 02	t	2026-08-27 01:27:06.236	2026-08-27 01:27:06.236
cmtauej9l000ufdfgaxtnfssx	business_deliveryreg_manaus	\N	embalagem	Embalagem	t	2026-08-27 01:27:06.237	2026-08-28 04:58:15.956
cmtauej98000rfdfgrz42dzub	business_deliveryreg_manaus	cmtauehfd0003fdfgawgmpd1c	qr-centro-01	QR Code Centro 01	t	2026-08-27 01:27:06.236	2026-08-27 01:27:06.236
cmtauej9n000xfdfgidwk41d6	business_deliveryreg_manaus	cmtauehf10001fdfg58o96yme	qr-ponta-negra-01	QR Code Ponta Negra 01	t	2026-08-27 01:27:06.236	2026-08-27 01:27:06.236
cmtauej9s000zfdfgrk3ja0zr	business_deliveryreg_manaus	cmtauehfd0003fdfgawgmpd1c	qr-centro-02	QR Code Centro 02	t	2026-08-27 01:27:06.237	2026-08-27 01:27:06.237
cmtauej9m000vfdfgr2jtneda	business_deliveryreg_manaus	\N	balcao	Balcão	t	2026-08-27 01:27:06.237	2026-08-28 04:58:15.956
cmtchdxxv001vfdl8v98qplu8	business_deliveryreg_manaus	cmtauehf10001fdfg58o96yme	qr-alvorada-2-01	QR Code Alvorada 2 - 01	t	2026-08-28 04:58:15.956	2026-08-28 04:58:15.956
cmtchdxyf001zfdl8chti6ids	business_deliveryreg_manaus	cmtauehfd0003fdfgawgmpd1c	qr-alvorada-1-02	QR Code Alvorada 1 - 02	t	2026-08-28 04:58:15.956	2026-08-28 04:58:15.956
cmtauej9y0012fdfgenmal2x2	business_deliveryreg_manaus	\N	whatsapp	WhatsApp	t	2026-08-27 01:27:06.236	2026-08-28 04:58:15.956
cmtchdxyy0023fdl8qjo9h7u2	business_deliveryreg_manaus	cmtauehf10001fdfg58o96yme	qr-alvorada-2-02	QR Code Alvorada 2 - 02	t	2026-08-28 04:58:15.956	2026-08-28 04:58:15.956
cmtauej9y0013fdfg7ix9i1j9	business_deliveryreg_manaus	\N	instagram	Instagram	t	2026-08-27 01:27:06.236	2026-08-28 04:58:15.956
cmtchdxz50029fdl8s8tmzuec	business_deliveryreg_manaus	cmtauehfd0003fdfgawgmpd1c	qr-alvorada-1-01	QR Code Alvorada 1 - 01	t	2026-08-28 04:58:15.956	2026-08-28 04:58:15.956
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: deliveryreg
--

COPY public."Order" (id, "businessId", "branchId", "customerId", status, "subtotalCents", "totalCents", "createdByUserId", "completedAt", "cancelledAt", "createdAt", "updatedAt", "leadId", "leadSourceId", "fulfillmentType", "salesChannel") FROM stdin;
cmtbv8kdu0013fdozdo36aesp	business_deliveryreg_manaus	cmtauehfd0003fdfgawgmpd1c	cmtbv8kcd000zfdoz6bvwatub	CREATED	2520	2520	\N	\N	\N	2026-08-27 18:38:13.554	2026-08-27 18:38:13.554	cmtbv8kcm0011fdozkevgokis	\N	PICKUP	DIGITAL
cmtbvfcjl002ffdozw0gowncx	business_deliveryreg_manaus	cmtauehfd0003fdfgawgmpd1c	cmtbvfcic0029fdozlqtvw0mf	CREATED	4200	5000	\N	\N	\N	2026-08-27 18:43:29.985	2026-08-27 18:43:29.985	cmtbvfcii002bfdozqtkthz4v	\N	DELIVERY	DIGITAL
cmtbvge5v003dfdoz64k8xj06	business_deliveryreg_manaus	cmtauehfd0003fdfgawgmpd1c	cmtbvfcic0029fdozlqtvw0mf	CREATED	4200	5000	\N	\N	\N	2026-08-27 18:44:18.739	2026-08-27 18:44:18.739	cmtbvfcii002bfdozqtkthz4v	\N	DELIVERY	DIGITAL
\.


--
-- Data for Name: OrderItem; Type: TABLE DATA; Schema: public; Owner: deliveryreg
--

COPY public."OrderItem" (id, "businessId", "orderId", "productId", "productNameSnapshot", "measurementTypeSnapshot", "requestedQuantity", "actualQuantity", "priceCentsSnapshot", "priceBasisQuantitySnapshot", "priceBasisUnitSnapshot", "estimatedAmountCents", "finalAmountCents", "createdAt", "updatedAt") FROM stdin;
cmtbv8kdv0015fdoz93vz9t7j	business_deliveryreg_manaus	cmtbv8kdu0013fdozdo36aesp	cmtauej8i000hfdfguqlz972n	Queijo regional	WEIGHT	600	\N	4200	1000	GRAM	2520	\N	2026-08-27 18:38:13.554	2026-08-27 18:38:13.554
cmtbvfcjl002hfdoz7savrgad	business_deliveryreg_manaus	cmtbvfcjl002ffdozw0gowncx	cmtauej8i000hfdfguqlz972n	Queijo regional	WEIGHT	1000	\N	4200	1000	GRAM	4200	\N	2026-08-27 18:43:29.985	2026-08-27 18:43:29.985
cmtbvge5v003ffdozz7pb0v9y	business_deliveryreg_manaus	cmtbvge5v003dfdoz64k8xj06	cmtauej8i000hfdfguqlz972n	Queijo regional	WEIGHT	1000	\N	4200	1000	GRAM	4200	\N	2026-08-27 18:44:18.739	2026-08-27 18:44:18.739
\.


--
-- Data for Name: OrderStatusHistory; Type: TABLE DATA; Schema: public; Owner: deliveryreg
--

COPY public."OrderStatusHistory" (id, "businessId", "orderId", "actorUserId", "fromStatus", "toStatus", reason, "createdAt") FROM stdin;
\.


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: deliveryreg
--

COPY public."Payment" (id, "businessId", "branchId", "orderId", "actorUserId", method, "amountCents", "createdAt", "cashSessionId") FROM stdin;
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: deliveryreg
--

COPY public."Product" (id, "businessId", name, "measurementType", "baseUnit", "sellingIncrement", "minimumOrderQuantity", "isActive", "createdAt", "updatedAt", "categoryId", slug, description, "imageUrl") FROM stdin;
cmtauej8i000hfdfguqlz972n	business_deliveryreg_manaus	Queijo regional	WEIGHT	GRAM	50	500	t	2026-08-27 01:27:06.211	2026-08-27 01:27:06.211	cmtauej8c000ffdfgd8kz98sj	queijo-regional	Peça o peso desejado e pague pelo peso real separado na unidade.	\N
cmtchdxu4000pfdl82il17gtn	business_deliveryreg_manaus	Queijo de búfalo	WEIGHT	GRAM	50	250	t	2026-08-28 04:58:15.82	2026-08-28 04:58:15.82	cmtauej8c000ffdfgd8kz98sj	queijo-de-bufalo	Queijo regional vendido por peso.	\N
cmtchdxuw000xfdl8bd3xp1t9	business_deliveryreg_manaus	Queijo coalho	WEIGHT	GRAM	50	250	t	2026-08-28 04:58:15.849	2026-08-28 04:58:15.849	cmtauej8c000ffdfgd8kz98sj	queijo-coalho	Queijo coalho vendido por peso.	\N
cmtchdxvk0015fdl8ee94tk69	business_deliveryreg_manaus	Queijo manteiga	WEIGHT	GRAM	50	250	t	2026-08-28 04:58:15.873	2026-08-28 04:58:15.873	cmtauej8c000ffdfgd8kz98sj	queijo-manteiga	Queijo manteiga vendido por peso.	\N
cmtchdxwa001dfdl8jly8mfjp	business_deliveryreg_manaus	Farinha de tapioca	PACKAGE	PACKAGE	1	1	t	2026-08-28 04:58:15.898	2026-08-28 04:58:15.898	cmtchdxt6000ffdl8cc7esyvs	farinha-de-tapioca	Produto regional aguardando preço comercial no Admin.	\N
cmtchdxww001jfdl8dghnrf60	business_deliveryreg_manaus	Goma de tapioca	PACKAGE	PACKAGE	1	1	t	2026-08-28 04:58:15.92	2026-08-28 04:58:15.92	cmtchdxt6000ffdl8cc7esyvs	goma-de-tapioca	Produto regional aguardando preço comercial no Admin.	\N
cmtchdxxd001pfdl8w16ih465	business_deliveryreg_manaus	Pé de moleque	UNIT	UNIT	1	1	t	2026-08-28 04:58:15.937	2026-08-28 04:58:15.937	cmtchdxte000hfdl8yvz9ae8j	pe-de-moleque	Produto regional aguardando preço comercial no Admin.	\N
\.


--
-- Data for Name: ProductBranchAvailability; Type: TABLE DATA; Schema: public; Owner: deliveryreg
--

COPY public."ProductBranchAvailability" (id, "businessId", "branchId", "productId", "isAvailable", "createdAt", "updatedAt") FROM stdin;
cmtauej8x000mfdfgqbstwlqm	business_deliveryreg_manaus	cmtauehfd0003fdfgawgmpd1c	cmtauej8i000hfdfguqlz972n	t	2026-08-27 01:27:06.226	2026-08-27 01:27:06.226
cmtauej8x000nfdfgvfutgf5j	business_deliveryreg_manaus	cmtauehf10001fdfg58o96yme	cmtauej8i000hfdfguqlz972n	t	2026-08-27 01:27:06.226	2026-08-27 01:27:06.226
cmtchdxuk000ufdl8980ujfot	business_deliveryreg_manaus	cmtauehfd0003fdfgawgmpd1c	cmtchdxu4000pfdl82il17gtn	t	2026-08-28 04:58:15.836	2026-08-28 04:58:15.836
cmtchdxuk000vfdl8tn8s30kn	business_deliveryreg_manaus	cmtauehf10001fdfg58o96yme	cmtchdxu4000pfdl82il17gtn	t	2026-08-28 04:58:15.836	2026-08-28 04:58:15.836
cmtchdxva0012fdl8uk5vcb3r	business_deliveryreg_manaus	cmtauehf10001fdfg58o96yme	cmtchdxuw000xfdl8bd3xp1t9	t	2026-08-28 04:58:15.863	2026-08-28 04:58:15.863
cmtchdxva0013fdl8e1xdktmt	business_deliveryreg_manaus	cmtauehfd0003fdfgawgmpd1c	cmtchdxuw000xfdl8bd3xp1t9	t	2026-08-28 04:58:15.863	2026-08-28 04:58:15.863
cmtchdxvy001afdl8kpva7jpq	business_deliveryreg_manaus	cmtauehf10001fdfg58o96yme	cmtchdxvk0015fdl8ee94tk69	t	2026-08-28 04:58:15.886	2026-08-28 04:58:15.886
cmtchdxvy001bfdl82qyk90pd	business_deliveryreg_manaus	cmtauehfd0003fdfgawgmpd1c	cmtchdxvk0015fdl8ee94tk69	t	2026-08-28 04:58:15.886	2026-08-28 04:58:15.886
cmtchdxwl001gfdl8unbnp4p7	business_deliveryreg_manaus	cmtauehfd0003fdfgawgmpd1c	cmtchdxwa001dfdl8jly8mfjp	t	2026-08-28 04:58:15.91	2026-08-28 04:58:15.91
cmtchdxwl001hfdl8s051ayus	business_deliveryreg_manaus	cmtauehf10001fdfg58o96yme	cmtchdxwa001dfdl8jly8mfjp	t	2026-08-28 04:58:15.91	2026-08-28 04:58:15.91
cmtchdxx3001mfdl893u50dsq	business_deliveryreg_manaus	cmtauehfd0003fdfgawgmpd1c	cmtchdxww001jfdl8dghnrf60	t	2026-08-28 04:58:15.927	2026-08-28 04:58:15.927
cmtchdxx3001nfdl8xg9zoxrh	business_deliveryreg_manaus	cmtauehf10001fdfg58o96yme	cmtchdxww001jfdl8dghnrf60	t	2026-08-28 04:58:15.927	2026-08-28 04:58:15.927
cmtchdxxl001tfdl8giled1mu	business_deliveryreg_manaus	cmtauehf10001fdfg58o96yme	cmtchdxxd001pfdl8w16ih465	t	2026-08-28 04:58:15.945	2026-08-28 04:58:15.945
cmtchdxxk001rfdl8hv2h3z7o	business_deliveryreg_manaus	cmtauehfd0003fdfgawgmpd1c	cmtchdxxd001pfdl8w16ih465	t	2026-08-28 04:58:15.944	2026-08-28 04:58:15.944
\.


--
-- Data for Name: ProductCategory; Type: TABLE DATA; Schema: public; Owner: deliveryreg
--

COPY public."ProductCategory" (id, "businessId", name, slug, description, "sortOrder", "isActive", "createdAt", "updatedAt") FROM stdin;
cmtauej8c000ffdfgd8kz98sj	business_deliveryreg_manaus	Queijos	queijos	Produtos vendidos por peso e separados na loja	1	t	2026-08-27 01:27:06.204	2026-08-28 04:58:15.779
cmtchdxt6000ffdl8cc7esyvs	business_deliveryreg_manaus	Farinhas e derivados	farinhas-e-derivados	Tapiocas, gomas e derivados regionais.	2	t	2026-08-28 04:58:15.786	2026-08-28 04:58:15.786
cmtchdxte000hfdl8yvz9ae8j	business_deliveryreg_manaus	Regionais	regionais	Itens tradicionais da região.	3	t	2026-08-28 04:58:15.794	2026-08-28 04:58:15.794
\.


--
-- Data for Name: ProductPrice; Type: TABLE DATA; Schema: public; Owner: deliveryreg
--

COPY public."ProductPrice" (id, "businessId", "productId", "priceCents", "basisQuantity", "basisUnit", "priceBasis", "startsAt", "endsAt", "createdAt") FROM stdin;
cmtauej8r000jfdfgabaf1fer	business_deliveryreg_manaus	cmtauej8i000hfdfguqlz972n	4200	1000	GRAM	PER_BASE_UNIT	2026-08-27 01:27:06.22	\N	2026-08-27 01:27:06.22
cmtchdxue000rfdl8el2pjw0h	business_deliveryreg_manaus	cmtchdxu4000pfdl82il17gtn	4200	1000	GRAM	PER_BASE_UNIT	2026-08-28 04:58:15.83	\N	2026-08-28 04:58:15.83
cmtchdxv4000zfdl8wwwy6xj7	business_deliveryreg_manaus	cmtchdxuw000xfdl8bd3xp1t9	4200	1000	GRAM	PER_BASE_UNIT	2026-08-28 04:58:15.857	\N	2026-08-28 04:58:15.857
cmtchdxvt0017fdl8e8nzidjw	business_deliveryreg_manaus	cmtchdxvk0015fdl8ee94tk69	4500	1000	GRAM	PER_BASE_UNIT	2026-08-28 04:58:15.882	\N	2026-08-28 04:58:15.882
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: deliveryreg
--

COPY public."Session" (id, "userId", "tokenHash", "expiresAt", "createdAt", "revokedAt") FROM stdin;
cmtaug2tq0001fd4lidg06o22	cmtauehso0005fdfgr31od3h5	ec205c0c6f0d485f3fecf707f1151baf538307277a118fd9d75d59e7c6bf742f	2026-08-27 09:28:18.253	2026-08-27 01:28:18.255	\N
cmtauoqtt0001fd7zd6lbplwo	cmtauehso0005fdfgr31od3h5	13051deac946bab41db98cc3a72b5fcd026fbf70cb12b46c4608e82a20752f67	2026-08-27 09:35:02.608	2026-08-27 01:35:02.61	\N
cmtauxqbs0001fdnace5nd2eq	cmtauehso0005fdfgr31od3h5	e199e9d5bd785f946366d0a7de4e2c0e9b0974beed74adf0dfc7175e3b74119e	2026-08-27 09:42:01.863	2026-08-27 01:42:01.864	\N
cmtb3ixuj0001fdqxw13prwnr	cmtauehso0005fdfgr31od3h5	2eb4863062d830d5d0db61c61f6ac1233a361841859328f876d28794914eecda	2026-08-27 13:42:28.314	2026-08-27 05:42:28.316	\N
cmtb5hyc60001fd0n101c6209	cmtauehso0005fdfgr31od3h5	10867f6f4911ae1d701f9fca55a75239609573c0634fa41ea8530aef501826c6	2026-08-27 14:37:41.525	2026-08-27 06:37:41.527	\N
cmtb6vyz70005fdyw84tr08xy	cmtauehso0005fdfgr31od3h5	360add348b504e1cb5f8c2d3f57926fc62c4406b3ec7487306e397c572ed67eb	2026-08-27 15:16:35.153	2026-08-27 07:16:35.155	\N
cmtbwixti0001fdbqfq012737	cmtauehso0005fdfgr31od3h5	73ec6d5b036b12a44762dbee68e7c97b2d68a72a8f7a34039d18d0bd050ca958	2026-08-28 03:14:17.141	2026-08-27 19:14:17.143	\N
cmtcgyaxr0001fddzf5mxktlj	cmtauehso0005fdfgr31od3h5	a919c86ff7a7ccf33499390f428738de639ca605065b9017a9a87b330bedfd48	2026-08-28 12:46:06.302	2026-08-28 04:46:06.304	\N
\.


--
-- Data for Name: StockMovement; Type: TABLE DATA; Schema: public; Owner: deliveryreg
--

COPY public."StockMovement" (id, "businessId", "branchId", "productId", "actorUserId", type, "quantityDelta", reason, "sourceType", "sourceId", "idempotencyKeyId", metadata, "createdAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: deliveryreg
--

COPY public."User" (id, "businessId", email, name, "passwordHash", role, "isActive", "createdAt", "updatedAt") FROM stdin;
cmtauei5l0007fdfg5nmqh77w	business_deliveryreg_manaus	gerente@deliveryreg.local	Gerente	$2b$12$KxkFHjNl8AUJUXP3PYlLGejs9LUHyym8Me7kz5zGjW.X/7/c.wouW	MANAGER	t	2026-08-27 01:27:04.81	2026-08-27 01:27:04.81
cmtaueiio0009fdfg03t1dyc0	business_deliveryreg_manaus	atendente-centro@deliveryreg.local	Atendente Centro	$2b$12$KLp3CMs40LujwWB7wwqs..inaCt7fNnfwj2iZw1P0eNE1wUNgq2p6	ATTENDANT	t	2026-08-27 01:27:05.28	2026-08-27 01:27:05.28
cmtaueivi000bfdfg1w573ak4	business_deliveryreg_manaus	entregador-centro@deliveryreg.local	Entregador Centro	$2b$12$7MEQ1KoQLRkpoqvpCZEW/e7QMjySGItt4Jj7BQR1Npjuh8ZTe8Mfq	DELIVERY	t	2026-08-27 01:27:05.743	2026-08-27 01:27:05.743
cmtauej81000dfdfgjrty2woq	business_deliveryreg_manaus	entregador-ponta-negra@deliveryreg.local	Entregador Ponta Negra	$2b$12$g2jueaujr9yiWz8e/uHhXe8fqS4cwG6etwAcXe9rJ/oBgOuZ0M0pG	DELIVERY	t	2026-08-27 01:27:06.193	2026-08-27 01:27:06.193
cmtauehso0005fdfgr31od3h5	business_deliveryreg_manaus	admin@deliveryreg.local	Administrador	$2b$12$FMn/x87tB2Z800dJfk1N.OTZk2m4sltGqj1lAa0bz8MJvy6rjPhc6	OWNER	t	2026-08-27 01:27:04.344	2026-08-28 04:58:14.106
cmtchdwxr0007fdl81k0e0cp3	business_deliveryreg_manaus	atendente-alvorada-1@deliveryreg.local	Atendente Alvorada 1	$2b$12$mRGiyrqmvmOk4u2EFpE6Y.avBhsOiWmE8je6rR67lCZlvmk/UVgdG	ATTENDANT	t	2026-08-28 04:58:14.655	2026-08-28 04:58:14.655
cmtchdxd80009fdl8wn1p613e	business_deliveryreg_manaus	entregador-alvorada-1@deliveryreg.local	Entregador Alvorada 1	$2b$12$a8C/yquJevav0ZYyOt0V6.c4fQNwp4qqSjAcDmRnV0XCcqe4nD5Hy	DELIVERY	t	2026-08-28 04:58:15.212	2026-08-28 04:58:15.212
cmtchdxsl000bfdl85imi5p9s	business_deliveryreg_manaus	entregador-alvorada-2@deliveryreg.local	Entregador Alvorada 2	$2b$12$OW1oajv9pOTtxzGL/TLNQOhVT2HNhIqsCz7RIHFT9zy88cwJZfpWi	DELIVERY	t	2026-08-28 04:58:15.765	2026-08-28 04:58:15.765
\.


--
-- Data for Name: UserBranchAccess; Type: TABLE DATA; Schema: public; Owner: deliveryreg
--

COPY public."UserBranchAccess" ("userId", "branchId", "createdAt") FROM stdin;
cmtauehso0005fdfgr31od3h5	cmtauehf10001fdfg58o96yme	2026-08-27 01:27:04.351
cmtauei5l0007fdfg5nmqh77w	cmtauehfd0003fdfgawgmpd1c	2026-08-27 01:27:04.816
cmtauehso0005fdfgr31od3h5	cmtauehfd0003fdfgawgmpd1c	2026-08-27 01:27:04.351
cmtauei5l0007fdfg5nmqh77w	cmtauehf10001fdfg58o96yme	2026-08-27 01:27:04.816
cmtaueiio0009fdfg03t1dyc0	cmtauehfd0003fdfgawgmpd1c	2026-08-27 01:27:05.286
cmtaueivi000bfdfg1w573ak4	cmtauehfd0003fdfgawgmpd1c	2026-08-27 01:27:05.748
cmtauej81000dfdfgjrty2woq	cmtauehf10001fdfg58o96yme	2026-08-27 01:27:06.198
cmtchdwxr0007fdl81k0e0cp3	cmtauehfd0003fdfgawgmpd1c	2026-08-28 04:58:14.662
cmtchdxd80009fdl8wn1p613e	cmtauehfd0003fdfgawgmpd1c	2026-08-28 04:58:15.218
cmtchdxsl000bfdl85imi5p9s	cmtauehf10001fdfg58o96yme	2026-08-28 04:58:15.77
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: deliveryreg
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
554063d2-d259-4239-91f6-32a81c33ec72	ff27786c1f635b9ef3800a1bfef2e613339669877c6ffd362b9bba4567d5bb4a	2026-08-27 01:23:21.714599+00	20260815190000_foundation	\N	\N	2026-08-27 01:23:21.247716+00	1
593f9905-1837-4892-b06e-584bbfaac36a	35e3dd1eecea4d20e21c359e56de867351ffedba79e74e40b50332be7a61161c	2026-08-27 01:23:21.842823+00	20260815202000_product_domain	\N	\N	2026-08-27 01:23:21.720096+00	1
4e962195-b42a-452f-a523-6d55e227e7b6	b9b55683276fd007e716b64847ce05f7fd2833b3fa905339360643e163c1d332	2026-08-27 01:23:22.012316+00	20260815212000_public_pwa_leads	\N	\N	2026-08-27 01:23:21.848318+00	1
3c1bd0f7-7217-448c-8578-57d83229093c	84f1277e6174f3440f86a81809702469ac4e3425f04d7e2b08dcbfac3576f422	2026-08-27 01:23:22.068453+00	20260815223000_cart_pickup_order	\N	\N	2026-08-27 01:23:22.018093+00	1
aef7d9de-a067-4947-a882-62a455f39d20	2fee491626680e0487ccae5bc86dba4d2d3064ab22e2ab0688e3a0fc50132437	2026-08-27 01:23:22.134146+00	20260815233000_store_operation_weighing	\N	\N	2026-08-27 01:23:22.075533+00	1
179aca38-6bd4-4a6f-a4f7-9af58be09899	29e3859af67a11c62ff86df1151a80228f72911a1422a032aedae96baa8960eb	2026-08-27 01:23:22.201774+00	20260816003000_pos_inventory	\N	\N	2026-08-27 01:23:22.141309+00	1
6e866e4e-d1a3-40ef-9fee-e77281f6b066	c5db1a072322ce3720598d1a59036cf88d338b18dcd7047f19f53525cbaec277	2026-08-27 01:23:22.385761+00	20260816013000_delivery_pilot	\N	\N	2026-08-27 01:23:22.210329+00	1
7719084a-d504-43a5-9b92-6e84c654154e	b8e64d8244030b6713e74067e0d6b339abfe6e19944f36ed3f72860a37bbb9ca	2026-08-27 01:23:22.41144+00	20260816023000_auth_delivery_hardening	\N	\N	2026-08-27 01:23:22.392454+00	1
e7ad918c-76d2-4cd3-bb9e-d841d6572e05	22471394de4af47f7a5a963841ab58a9e20d7c3d54ffbb8ebd249a2fc676d356	2026-08-27 01:23:22.518938+00	20260826210000_cash_register	\N	\N	2026-08-27 01:23:22.416331+00	1
\.


--
-- Name: Address Address_pkey; Type: CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."Address"
    ADD CONSTRAINT "Address_pkey" PRIMARY KEY (id);


--
-- Name: AnalyticsEvent AnalyticsEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."AnalyticsEvent"
    ADD CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY (id);


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: Branch Branch_pkey; Type: CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."Branch"
    ADD CONSTRAINT "Branch_pkey" PRIMARY KEY (id);


--
-- Name: Business Business_pkey; Type: CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."Business"
    ADD CONSTRAINT "Business_pkey" PRIMARY KEY (id);


--
-- Name: CashMovement CashMovement_pkey; Type: CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."CashMovement"
    ADD CONSTRAINT "CashMovement_pkey" PRIMARY KEY (id);


--
-- Name: CashSession CashSession_pkey; Type: CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."CashSession"
    ADD CONSTRAINT "CashSession_pkey" PRIMARY KEY (id);


--
-- Name: Customer Customer_pkey; Type: CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."Customer"
    ADD CONSTRAINT "Customer_pkey" PRIMARY KEY (id);


--
-- Name: DeliveryZone DeliveryZone_pkey; Type: CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."DeliveryZone"
    ADD CONSTRAINT "DeliveryZone_pkey" PRIMARY KEY (id);


--
-- Name: Delivery Delivery_pkey; Type: CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."Delivery"
    ADD CONSTRAINT "Delivery_pkey" PRIMARY KEY (id);


--
-- Name: IdempotencyKey IdempotencyKey_pkey; Type: CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."IdempotencyKey"
    ADD CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY (id);


--
-- Name: LeadSource LeadSource_pkey; Type: CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."LeadSource"
    ADD CONSTRAINT "LeadSource_pkey" PRIMARY KEY (id);


--
-- Name: Lead Lead_pkey; Type: CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."Lead"
    ADD CONSTRAINT "Lead_pkey" PRIMARY KEY (id);


--
-- Name: OrderItem OrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY (id);


--
-- Name: OrderStatusHistory OrderStatusHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."OrderStatusHistory"
    ADD CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY (id);


--
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- Name: ProductBranchAvailability ProductBranchAvailability_pkey; Type: CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."ProductBranchAvailability"
    ADD CONSTRAINT "ProductBranchAvailability_pkey" PRIMARY KEY (id);


--
-- Name: ProductCategory ProductCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."ProductCategory"
    ADD CONSTRAINT "ProductCategory_pkey" PRIMARY KEY (id);


--
-- Name: ProductPrice ProductPrice_pkey; Type: CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."ProductPrice"
    ADD CONSTRAINT "ProductPrice_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: StockMovement StockMovement_pkey; Type: CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."StockMovement"
    ADD CONSTRAINT "StockMovement_pkey" PRIMARY KEY (id);


--
-- Name: UserBranchAccess UserBranchAccess_pkey; Type: CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."UserBranchAccess"
    ADD CONSTRAINT "UserBranchAccess_pkey" PRIMARY KEY ("userId", "branchId");


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Address_businessId_customerId_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "Address_businessId_customerId_idx" ON public."Address" USING btree ("businessId", "customerId");


--
-- Name: Address_businessId_neighborhood_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "Address_businessId_neighborhood_idx" ON public."Address" USING btree ("businessId", neighborhood);


--
-- Name: AnalyticsEvent_businessId_anonymousId_occurredAt_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "AnalyticsEvent_businessId_anonymousId_occurredAt_idx" ON public."AnalyticsEvent" USING btree ("businessId", "anonymousId", "occurredAt");


--
-- Name: AnalyticsEvent_businessId_branchId_occurredAt_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "AnalyticsEvent_businessId_branchId_occurredAt_idx" ON public."AnalyticsEvent" USING btree ("businessId", "branchId", "occurredAt");


--
-- Name: AnalyticsEvent_businessId_eventType_occurredAt_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "AnalyticsEvent_businessId_eventType_occurredAt_idx" ON public."AnalyticsEvent" USING btree ("businessId", "eventType", "occurredAt");


--
-- Name: AnalyticsEvent_businessId_leadSourceId_occurredAt_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "AnalyticsEvent_businessId_leadSourceId_occurredAt_idx" ON public."AnalyticsEvent" USING btree ("businessId", "leadSourceId", "occurredAt");


--
-- Name: AuditLog_businessId_createdAt_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "AuditLog_businessId_createdAt_idx" ON public."AuditLog" USING btree ("businessId", "createdAt");


--
-- Name: AuditLog_businessId_entityType_entityId_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "AuditLog_businessId_entityType_entityId_idx" ON public."AuditLog" USING btree ("businessId", "entityType", "entityId");


--
-- Name: Branch_businessId_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "Branch_businessId_idx" ON public."Branch" USING btree ("businessId");


--
-- Name: Branch_businessId_name_key; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE UNIQUE INDEX "Branch_businessId_name_key" ON public."Branch" USING btree ("businessId", name);


--
-- Name: CashMovement_businessId_branchId_createdAt_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "CashMovement_businessId_branchId_createdAt_idx" ON public."CashMovement" USING btree ("businessId", "branchId", "createdAt");


--
-- Name: CashMovement_businessId_cashSessionId_createdAt_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "CashMovement_businessId_cashSessionId_createdAt_idx" ON public."CashMovement" USING btree ("businessId", "cashSessionId", "createdAt");


--
-- Name: CashSession_businessId_branchId_status_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "CashSession_businessId_branchId_status_idx" ON public."CashSession" USING btree ("businessId", "branchId", status);


--
-- Name: CashSession_businessId_closedAt_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "CashSession_businessId_closedAt_idx" ON public."CashSession" USING btree ("businessId", "closedAt");


--
-- Name: CashSession_businessId_openedAt_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "CashSession_businessId_openedAt_idx" ON public."CashSession" USING btree ("businessId", "openedAt");


--
-- Name: CashSession_one_open_per_branch_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE UNIQUE INDEX "CashSession_one_open_per_branch_idx" ON public."CashSession" USING btree ("businessId", "branchId") WHERE (status = 'OPEN'::public."CashSessionStatus");


--
-- Name: Customer_businessId_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "Customer_businessId_idx" ON public."Customer" USING btree ("businessId");


--
-- Name: Customer_businessId_normalizedPhone_key; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE UNIQUE INDEX "Customer_businessId_normalizedPhone_key" ON public."Customer" USING btree ("businessId", "normalizedPhone");


--
-- Name: DeliveryZone_businessId_branchId_isActive_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "DeliveryZone_businessId_branchId_isActive_idx" ON public."DeliveryZone" USING btree ("businessId", "branchId", "isActive");


--
-- Name: DeliveryZone_businessId_branchId_normalizedName_key; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE UNIQUE INDEX "DeliveryZone_businessId_branchId_normalizedName_key" ON public."DeliveryZone" USING btree ("businessId", "branchId", "normalizedName");


--
-- Name: Delivery_businessId_assignedUserId_status_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "Delivery_businessId_assignedUserId_status_idx" ON public."Delivery" USING btree ("businessId", "assignedUserId", status);


--
-- Name: Delivery_businessId_branchId_status_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "Delivery_businessId_branchId_status_idx" ON public."Delivery" USING btree ("businessId", "branchId", status);


--
-- Name: Delivery_orderId_key; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE UNIQUE INDEX "Delivery_orderId_key" ON public."Delivery" USING btree ("orderId");


--
-- Name: IdempotencyKey_businessId_operation_key_key; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE UNIQUE INDEX "IdempotencyKey_businessId_operation_key_key" ON public."IdempotencyKey" USING btree ("businessId", operation, key);


--
-- Name: IdempotencyKey_expiresAt_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "IdempotencyKey_expiresAt_idx" ON public."IdempotencyKey" USING btree ("expiresAt");


--
-- Name: LeadSource_businessId_branchId_isActive_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "LeadSource_businessId_branchId_isActive_idx" ON public."LeadSource" USING btree ("businessId", "branchId", "isActive");


--
-- Name: LeadSource_businessId_code_key; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE UNIQUE INDEX "LeadSource_businessId_code_key" ON public."LeadSource" USING btree ("businessId", code);


--
-- Name: Lead_businessId_branchId_createdAt_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "Lead_businessId_branchId_createdAt_idx" ON public."Lead" USING btree ("businessId", "branchId", "createdAt");


--
-- Name: Lead_businessId_leadSourceId_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "Lead_businessId_leadSourceId_idx" ON public."Lead" USING btree ("businessId", "leadSourceId");


--
-- Name: Lead_businessId_normalizedPhone_key; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE UNIQUE INDEX "Lead_businessId_normalizedPhone_key" ON public."Lead" USING btree ("businessId", "normalizedPhone");


--
-- Name: OrderItem_businessId_orderId_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "OrderItem_businessId_orderId_idx" ON public."OrderItem" USING btree ("businessId", "orderId");


--
-- Name: OrderItem_businessId_productId_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "OrderItem_businessId_productId_idx" ON public."OrderItem" USING btree ("businessId", "productId");


--
-- Name: OrderStatusHistory_businessId_orderId_createdAt_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "OrderStatusHistory_businessId_orderId_createdAt_idx" ON public."OrderStatusHistory" USING btree ("businessId", "orderId", "createdAt");


--
-- Name: Order_businessId_branchId_status_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "Order_businessId_branchId_status_idx" ON public."Order" USING btree ("businessId", "branchId", status);


--
-- Name: Order_businessId_createdAt_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "Order_businessId_createdAt_idx" ON public."Order" USING btree ("businessId", "createdAt");


--
-- Name: Order_businessId_customerId_createdAt_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "Order_businessId_customerId_createdAt_idx" ON public."Order" USING btree ("businessId", "customerId", "createdAt");


--
-- Name: Payment_businessId_branchId_createdAt_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "Payment_businessId_branchId_createdAt_idx" ON public."Payment" USING btree ("businessId", "branchId", "createdAt");


--
-- Name: Payment_businessId_cashSessionId_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "Payment_businessId_cashSessionId_idx" ON public."Payment" USING btree ("businessId", "cashSessionId");


--
-- Name: Payment_businessId_orderId_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "Payment_businessId_orderId_idx" ON public."Payment" USING btree ("businessId", "orderId");


--
-- Name: ProductBranchAvailability_businessId_branchId_isAvailable_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "ProductBranchAvailability_businessId_branchId_isAvailable_idx" ON public."ProductBranchAvailability" USING btree ("businessId", "branchId", "isAvailable");


--
-- Name: ProductBranchAvailability_businessId_branchId_productId_key; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE UNIQUE INDEX "ProductBranchAvailability_businessId_branchId_productId_key" ON public."ProductBranchAvailability" USING btree ("businessId", "branchId", "productId");


--
-- Name: ProductBranchAvailability_businessId_productId_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "ProductBranchAvailability_businessId_productId_idx" ON public."ProductBranchAvailability" USING btree ("businessId", "productId");


--
-- Name: ProductCategory_businessId_isActive_sortOrder_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "ProductCategory_businessId_isActive_sortOrder_idx" ON public."ProductCategory" USING btree ("businessId", "isActive", "sortOrder");


--
-- Name: ProductCategory_businessId_slug_key; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE UNIQUE INDEX "ProductCategory_businessId_slug_key" ON public."ProductCategory" USING btree ("businessId", slug);


--
-- Name: ProductPrice_businessId_productId_startsAt_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "ProductPrice_businessId_productId_startsAt_idx" ON public."ProductPrice" USING btree ("businessId", "productId", "startsAt");


--
-- Name: Product_businessId_categoryId_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "Product_businessId_categoryId_idx" ON public."Product" USING btree ("businessId", "categoryId");


--
-- Name: Product_businessId_isActive_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "Product_businessId_isActive_idx" ON public."Product" USING btree ("businessId", "isActive");


--
-- Name: Product_businessId_slug_key; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE UNIQUE INDEX "Product_businessId_slug_key" ON public."Product" USING btree ("businessId", slug);


--
-- Name: Session_expiresAt_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "Session_expiresAt_idx" ON public."Session" USING btree ("expiresAt");


--
-- Name: Session_tokenHash_key; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE UNIQUE INDEX "Session_tokenHash_key" ON public."Session" USING btree ("tokenHash");


--
-- Name: Session_userId_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "Session_userId_idx" ON public."Session" USING btree ("userId");


--
-- Name: StockMovement_businessId_branchId_productId_createdAt_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "StockMovement_businessId_branchId_productId_createdAt_idx" ON public."StockMovement" USING btree ("businessId", "branchId", "productId", "createdAt");


--
-- Name: StockMovement_businessId_sourceType_sourceId_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "StockMovement_businessId_sourceType_sourceId_idx" ON public."StockMovement" USING btree ("businessId", "sourceType", "sourceId");


--
-- Name: User_businessId_email_key; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE UNIQUE INDEX "User_businessId_email_key" ON public."User" USING btree ("businessId", email);


--
-- Name: User_businessId_role_idx; Type: INDEX; Schema: public; Owner: deliveryreg
--

CREATE INDEX "User_businessId_role_idx" ON public."User" USING btree ("businessId", role);


--
-- Name: Address Address_businessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."Address"
    ADD CONSTRAINT "Address_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES public."Business"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Address Address_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."Address"
    ADD CONSTRAINT "Address_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AnalyticsEvent AnalyticsEvent_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."AnalyticsEvent"
    ADD CONSTRAINT "AnalyticsEvent_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AnalyticsEvent AnalyticsEvent_businessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."AnalyticsEvent"
    ADD CONSTRAINT "AnalyticsEvent_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES public."Business"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AnalyticsEvent AnalyticsEvent_leadSourceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."AnalyticsEvent"
    ADD CONSTRAINT "AnalyticsEvent_leadSourceId_fkey" FOREIGN KEY ("leadSourceId") REFERENCES public."LeadSource"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AuditLog AuditLog_actorUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AuditLog AuditLog_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AuditLog AuditLog_businessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES public."Business"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Branch Branch_businessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."Branch"
    ADD CONSTRAINT "Branch_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES public."Business"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CashMovement CashMovement_actorUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."CashMovement"
    ADD CONSTRAINT "CashMovement_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CashMovement CashMovement_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."CashMovement"
    ADD CONSTRAINT "CashMovement_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CashMovement CashMovement_businessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."CashMovement"
    ADD CONSTRAINT "CashMovement_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES public."Business"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CashMovement CashMovement_cashSessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."CashMovement"
    ADD CONSTRAINT "CashMovement_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES public."CashSession"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CashSession CashSession_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."CashSession"
    ADD CONSTRAINT "CashSession_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CashSession CashSession_businessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."CashSession"
    ADD CONSTRAINT "CashSession_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES public."Business"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CashSession CashSession_closedByUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."CashSession"
    ADD CONSTRAINT "CashSession_closedByUserId_fkey" FOREIGN KEY ("closedByUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CashSession CashSession_openedByUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."CashSession"
    ADD CONSTRAINT "CashSession_openedByUserId_fkey" FOREIGN KEY ("openedByUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Customer Customer_businessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."Customer"
    ADD CONSTRAINT "Customer_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES public."Business"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DeliveryZone DeliveryZone_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."DeliveryZone"
    ADD CONSTRAINT "DeliveryZone_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DeliveryZone DeliveryZone_businessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."DeliveryZone"
    ADD CONSTRAINT "DeliveryZone_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES public."Business"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Delivery Delivery_addressId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."Delivery"
    ADD CONSTRAINT "Delivery_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES public."Address"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Delivery Delivery_businessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."Delivery"
    ADD CONSTRAINT "Delivery_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES public."Business"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Delivery Delivery_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."Delivery"
    ADD CONSTRAINT "Delivery_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: IdempotencyKey IdempotencyKey_businessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."IdempotencyKey"
    ADD CONSTRAINT "IdempotencyKey_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES public."Business"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LeadSource LeadSource_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."LeadSource"
    ADD CONSTRAINT "LeadSource_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LeadSource LeadSource_businessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."LeadSource"
    ADD CONSTRAINT "LeadSource_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES public."Business"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Lead Lead_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."Lead"
    ADD CONSTRAINT "Lead_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Lead Lead_businessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."Lead"
    ADD CONSTRAINT "Lead_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES public."Business"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Lead Lead_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."Lead"
    ADD CONSTRAINT "Lead_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Lead Lead_leadSourceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."Lead"
    ADD CONSTRAINT "Lead_leadSourceId_fkey" FOREIGN KEY ("leadSourceId") REFERENCES public."LeadSource"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: OrderItem OrderItem_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OrderItem OrderItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OrderStatusHistory OrderStatusHistory_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."OrderStatusHistory"
    ADD CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Order Order_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Order Order_businessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES public."Business"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Order Order_createdByUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Order Order_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Order Order_leadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES public."Lead"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Order Order_leadSourceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_leadSourceId_fkey" FOREIGN KEY ("leadSourceId") REFERENCES public."LeadSource"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Payment Payment_cashSessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES public."CashSession"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Payment Payment_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProductBranchAvailability ProductBranchAvailability_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."ProductBranchAvailability"
    ADD CONSTRAINT "ProductBranchAvailability_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductBranchAvailability ProductBranchAvailability_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."ProductBranchAvailability"
    ADD CONSTRAINT "ProductBranchAvailability_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductCategory ProductCategory_businessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."ProductCategory"
    ADD CONSTRAINT "ProductCategory_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES public."Business"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProductPrice ProductPrice_businessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."ProductPrice"
    ADD CONSTRAINT "ProductPrice_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES public."Business"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProductPrice ProductPrice_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."ProductPrice"
    ADD CONSTRAINT "ProductPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Product Product_businessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES public."Business"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Product Product_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."ProductCategory"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: StockMovement StockMovement_actorUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."StockMovement"
    ADD CONSTRAINT "StockMovement_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: StockMovement StockMovement_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."StockMovement"
    ADD CONSTRAINT "StockMovement_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StockMovement StockMovement_businessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."StockMovement"
    ADD CONSTRAINT "StockMovement_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES public."Business"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StockMovement StockMovement_idempotencyKeyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."StockMovement"
    ADD CONSTRAINT "StockMovement_idempotencyKeyId_fkey" FOREIGN KEY ("idempotencyKeyId") REFERENCES public."IdempotencyKey"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: StockMovement StockMovement_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."StockMovement"
    ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: UserBranchAccess UserBranchAccess_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."UserBranchAccess"
    ADD CONSTRAINT "UserBranchAccess_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserBranchAccess UserBranchAccess_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."UserBranchAccess"
    ADD CONSTRAINT "UserBranchAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: User User_businessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: deliveryreg
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES public."Business"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict XDJKJ7Kcg0I0btGp2LAhEE3ZHjLO8vxAwJI429pVdqyFpdremU95e4s2QNlbbcf

