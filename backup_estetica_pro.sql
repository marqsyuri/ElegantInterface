--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.9

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: appointments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.appointments (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    client_id integer NOT NULL,
    service_id integer NOT NULL,
    appointment_date timestamp without time zone NOT NULL,
    status character varying DEFAULT 'scheduled'::character varying NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    before_images jsonb DEFAULT '[]'::jsonb,
    after_images jsonb DEFAULT '[]'::jsonb,
    duration integer DEFAULT 60,
    service_type character varying DEFAULT 'service'::character varying,
    total_amount numeric(10,2) DEFAULT 0,
    paid_amount numeric(10,2) DEFAULT 0,
    payment_status character varying DEFAULT 'pending'::character varying,
    selected_procedures jsonb DEFAULT '[]'::jsonb
);


ALTER TABLE public.appointments OWNER TO neondb_owner;

--
-- Name: appointments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.appointments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.appointments_id_seq OWNER TO neondb_owner;

--
-- Name: appointments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.appointments_id_seq OWNED BY public.appointments.id;


--
-- Name: business_hours; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.business_hours (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    day_of_week character varying NOT NULL,
    is_open boolean DEFAULT true,
    open_time character varying,
    close_time character varying,
    break_start_time character varying,
    break_end_time character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.business_hours OWNER TO neondb_owner;

--
-- Name: business_hours_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.business_hours_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.business_hours_id_seq OWNER TO neondb_owner;

--
-- Name: business_hours_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.business_hours_id_seq OWNED BY public.business_hours.id;


--
-- Name: client_packages; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.client_packages (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    client_id integer NOT NULL,
    package_id integer NOT NULL,
    purchase_date date NOT NULL,
    expiry_date date NOT NULL,
    sessions_used integer DEFAULT 0,
    total_sessions integer NOT NULL,
    status character varying DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.client_packages OWNER TO neondb_owner;

--
-- Name: client_packages_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.client_packages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.client_packages_id_seq OWNER TO neondb_owner;

--
-- Name: client_packages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.client_packages_id_seq OWNED BY public.client_packages.id;


--
-- Name: clients; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.clients (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    name character varying NOT NULL,
    cpf character varying,
    phone character varying,
    email character varying,
    birth_date date,
    health_history text,
    is_active boolean DEFAULT true,
    loyalty_points integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    profile_image text
);


ALTER TABLE public.clients OWNER TO neondb_owner;

--
-- Name: clients_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clients_id_seq OWNER TO neondb_owner;

--
-- Name: clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.clients_id_seq OWNED BY public.clients.id;


--
-- Name: clinical_records; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.clinical_records (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    client_id integer NOT NULL,
    appointment_id integer,
    procedure_date date NOT NULL,
    procedure character varying NOT NULL,
    observations text,
    result_rating integer,
    before_images jsonb,
    after_images jsonb,
    next_appointment date,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.clinical_records OWNER TO neondb_owner;

--
-- Name: clinical_records_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.clinical_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clinical_records_id_seq OWNER TO neondb_owner;

--
-- Name: clinical_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.clinical_records_id_seq OWNED BY public.clinical_records.id;


--
-- Name: feedback; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.feedback (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    client_id integer NOT NULL,
    appointment_id integer,
    rating integer NOT NULL,
    comment text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.feedback OWNER TO neondb_owner;

--
-- Name: feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.feedback_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.feedback_id_seq OWNER TO neondb_owner;

--
-- Name: feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.feedback_id_seq OWNED BY public.feedback.id;


--
-- Name: inventory; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.inventory (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    item_name character varying NOT NULL,
    category character varying NOT NULL,
    current_stock integer DEFAULT 0,
    min_stock integer DEFAULT 0,
    unit character varying NOT NULL,
    last_restocked date,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.inventory OWNER TO neondb_owner;

--
-- Name: inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.inventory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_id_seq OWNER TO neondb_owner;

--
-- Name: inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.inventory_id_seq OWNED BY public.inventory.id;


--
-- Name: loyalty_packages; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.loyalty_packages (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    name character varying NOT NULL,
    description text,
    services jsonb,
    original_price numeric(10,2),
    discounted_price numeric(10,2),
    discount_percentage integer,
    validity_days integer,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.loyalty_packages OWNER TO neondb_owner;

--
-- Name: loyalty_packages_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.loyalty_packages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.loyalty_packages_id_seq OWNER TO neondb_owner;

--
-- Name: loyalty_packages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.loyalty_packages_id_seq OWNED BY public.loyalty_packages.id;


--
-- Name: marketing_campaigns; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.marketing_campaigns (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    name character varying NOT NULL,
    type character varying NOT NULL,
    subject character varying,
    content text NOT NULL,
    target_audience character varying NOT NULL,
    status character varying DEFAULT 'draft'::character varying,
    scheduled_for timestamp without time zone,
    sent_at timestamp without time zone,
    open_rate numeric(5,2) DEFAULT '0'::numeric,
    click_rate numeric(5,2) DEFAULT '0'::numeric,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.marketing_campaigns OWNER TO neondb_owner;

--
-- Name: marketing_campaigns_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.marketing_campaigns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.marketing_campaigns_id_seq OWNER TO neondb_owner;

--
-- Name: marketing_campaigns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.marketing_campaigns_id_seq OWNED BY public.marketing_campaigns.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    client_id integer,
    type character varying NOT NULL,
    channel character varying NOT NULL,
    content text NOT NULL,
    is_scheduled boolean DEFAULT false,
    scheduled_for timestamp without time zone,
    sent_at timestamp without time zone,
    status character varying DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.messages OWNER TO neondb_owner;

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO neondb_owner;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    client_id integer,
    appointment_id integer,
    type character varying NOT NULL,
    title character varying NOT NULL,
    message text NOT NULL,
    channel character varying NOT NULL,
    status character varying DEFAULT 'pending'::character varying,
    scheduled_for timestamp without time zone,
    sent_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.notifications OWNER TO neondb_owner;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO neondb_owner;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    appointment_id integer,
    client_id integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency character varying DEFAULT 'NZD'::character varying,
    method character varying NOT NULL,
    status character varying DEFAULT 'pending'::character varying,
    transaction_id character varying,
    processed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.payments OWNER TO neondb_owner;

--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_id_seq OWNER TO neondb_owner;

--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: procedures; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.procedures (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    name character varying NOT NULL,
    description text,
    category character varying NOT NULL,
    duration integer,
    materials jsonb DEFAULT '[]'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    price numeric(10,2) DEFAULT 0
);


ALTER TABLE public.procedures OWNER TO neondb_owner;

--
-- Name: procedures_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.procedures_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.procedures_id_seq OWNER TO neondb_owner;

--
-- Name: procedures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.procedures_id_seq OWNED BY public.procedures.id;


--
-- Name: services; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.services (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    name character varying NOT NULL,
    description text,
    duration integer,
    price numeric(10,2),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    category character varying DEFAULT 'General'::character varying
);


ALTER TABLE public.services OWNER TO neondb_owner;

--
-- Name: services_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.services_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.services_id_seq OWNER TO neondb_owner;

--
-- Name: services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.services_id_seq OWNED BY public.services.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO neondb_owner;

--
-- Name: social_media_posts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.social_media_posts (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    platform character varying NOT NULL,
    content text NOT NULL,
    image_url character varying,
    post_type character varying NOT NULL,
    status character varying DEFAULT 'draft'::character varying,
    scheduled_for timestamp without time zone,
    published_at timestamp without time zone,
    engagement jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.social_media_posts OWNER TO neondb_owner;

--
-- Name: social_media_posts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.social_media_posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.social_media_posts_id_seq OWNER TO neondb_owner;

--
-- Name: social_media_posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.social_media_posts_id_seq OWNED BY public.social_media_posts.id;


--
-- Name: staff; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.staff (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    name character varying NOT NULL,
    email character varying,
    phone character varying,
    role character varying NOT NULL,
    specialties jsonb DEFAULT '[]'::jsonb,
    commission_rate numeric(5,2) DEFAULT '0'::numeric,
    is_active boolean DEFAULT true,
    start_date date DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.staff OWNER TO neondb_owner;

--
-- Name: staff_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.staff_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.staff_id_seq OWNER TO neondb_owner;

--
-- Name: staff_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.staff_id_seq OWNED BY public.staff.id;


--
-- Name: staff_schedules; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.staff_schedules (
    id integer NOT NULL,
    staff_id integer NOT NULL,
    day_of_week character varying NOT NULL,
    start_time character varying NOT NULL,
    end_time character varying NOT NULL,
    is_available boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.staff_schedules OWNER TO neondb_owner;

--
-- Name: staff_schedules_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.staff_schedules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.staff_schedules_id_seq OWNER TO neondb_owner;

--
-- Name: staff_schedules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.staff_schedules_id_seq OWNED BY public.staff_schedules.id;


--
-- Name: sustainability_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sustainability_logs (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    item_id integer,
    action character varying NOT NULL,
    quantity numeric(10,2) NOT NULL,
    waste_prevented numeric(10,2) DEFAULT '0'::numeric,
    notes text,
    date timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.sustainability_logs OWNER TO neondb_owner;

--
-- Name: sustainability_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sustainability_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sustainability_logs_id_seq OWNER TO neondb_owner;

--
-- Name: sustainability_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sustainability_logs_id_seq OWNED BY public.sustainability_logs.id;


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.transactions (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    client_id integer,
    appointment_id integer,
    type character varying NOT NULL,
    description character varying NOT NULL,
    amount numeric(10,2) NOT NULL,
    transaction_date date NOT NULL,
    category character varying,
    is_paid boolean DEFAULT false,
    due_date date,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.transactions OWNER TO neondb_owner;

--
-- Name: transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transactions_id_seq OWNER TO neondb_owner;

--
-- Name: transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.transactions_id_seq OWNED BY public.transactions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id character varying NOT NULL,
    email character varying,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    professional_registration character varying,
    specialties text,
    clinic_name character varying,
    clinic_cnpj character varying,
    clinic_address text,
    clinic_phone character varying,
    clinic_whatsapp character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    public_link character varying,
    hero_image_url character varying
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: appointments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.appointments ALTER COLUMN id SET DEFAULT nextval('public.appointments_id_seq'::regclass);


--
-- Name: business_hours id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.business_hours ALTER COLUMN id SET DEFAULT nextval('public.business_hours_id_seq'::regclass);


--
-- Name: client_packages id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.client_packages ALTER COLUMN id SET DEFAULT nextval('public.client_packages_id_seq'::regclass);


--
-- Name: clients id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clients ALTER COLUMN id SET DEFAULT nextval('public.clients_id_seq'::regclass);


--
-- Name: clinical_records id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clinical_records ALTER COLUMN id SET DEFAULT nextval('public.clinical_records_id_seq'::regclass);


--
-- Name: feedback id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feedback ALTER COLUMN id SET DEFAULT nextval('public.feedback_id_seq'::regclass);


--
-- Name: inventory id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inventory ALTER COLUMN id SET DEFAULT nextval('public.inventory_id_seq'::regclass);


--
-- Name: loyalty_packages id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.loyalty_packages ALTER COLUMN id SET DEFAULT nextval('public.loyalty_packages_id_seq'::regclass);


--
-- Name: marketing_campaigns id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.marketing_campaigns ALTER COLUMN id SET DEFAULT nextval('public.marketing_campaigns_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: procedures id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.procedures ALTER COLUMN id SET DEFAULT nextval('public.procedures_id_seq'::regclass);


--
-- Name: services id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.services ALTER COLUMN id SET DEFAULT nextval('public.services_id_seq'::regclass);


--
-- Name: social_media_posts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.social_media_posts ALTER COLUMN id SET DEFAULT nextval('public.social_media_posts_id_seq'::regclass);


--
-- Name: staff id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.staff ALTER COLUMN id SET DEFAULT nextval('public.staff_id_seq'::regclass);


--
-- Name: staff_schedules id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.staff_schedules ALTER COLUMN id SET DEFAULT nextval('public.staff_schedules_id_seq'::regclass);


--
-- Name: sustainability_logs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sustainability_logs ALTER COLUMN id SET DEFAULT nextval('public.sustainability_logs_id_seq'::regclass);


--
-- Name: transactions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);


--
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.appointments (id, user_id, client_id, service_id, appointment_date, status, notes, created_at, before_images, after_images, duration, service_type, total_amount, paid_amount, payment_status, selected_procedures) FROM stdin;
1	41745848	1	1	2025-01-29 10:00:00	scheduled	Test appointment with photos	2025-07-28 23:47:44.161117	["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="]	["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="]	60	service	0.00	0.00	pending	[]
2	41745848	1	2	2025-07-29 12:00:00	scheduled	\N	2025-07-29 17:15:50.741447	[]	[]	60	service	0.00	0.00	pending	[]
3	41745848	1	1	2025-07-30 12:30:00	confirmed	\N	2025-07-29 17:20:08.253536	[]	[]	60	service	0.00	0.00	pending	[]
4	41745848	4	1	2025-07-30 12:00:00	scheduled	\N	2025-07-29 17:50:48.136628	[]	[]	60	service	0.00	0.00	pending	[]
5	41745848	3	3	2025-07-30 13:30:00	confirmed	\N	2025-07-29 17:52:13.702728	[]	[]	45	service	0.00	0.00	pending	[]
6	41745848	2	3	2025-07-30 12:00:00	confirmed	\N	2025-07-29 17:59:08.629419	[]	[]	45	service	0.00	0.00	pending	[]
7	41745848	2	1	2025-07-30 13:00:00	confirmed	\N	2025-07-29 18:11:41.735512	[]	[]	45	service	0.00	0.00	pending	[]
8	41745848	2	1	2025-07-29 12:00:00	confirmed	\N	2025-07-29 18:48:17.471455	[]	[]	30	service	0.00	0.00	pending	[]
9	41745848	3	1	2025-07-30 11:00:00	completed	\N	2025-07-30 17:22:57.026083	[]	[]	45	service	0.00	0.00	pending	[]
10	41745848	5	4	2025-07-30 14:30:00	confirmed	Limpeza de pele facial - cliente com pele sensível	2025-07-30 17:54:35.79274	[]	[]	60	service	0.00	0.00	pending	[]
11	41745848	5	2	2025-07-30 11:30:00	confirmed	\N	2025-07-30 17:59:26.995197	[]	[]	45	service	0.00	0.00	pending	[]
12	41745848	5	2	2025-07-30 11:30:00	scheduled	\N	2025-07-30 18:03:28.181125	[]	[]	60	service	0.00	0.00	pending	[]
13	41745848	5	1	2025-07-30 11:00:00	confirmed	\N	2025-07-30 18:09:00.914334	[]	[]	45	service	0.00	0.00	pending	[]
14	41745848	4	3	2025-08-07 19:00:00	scheduled	Alongamento de cilios	2025-08-07 16:40:58.224895	[]	[]	60	service	0.00	0.00	pending	[]
37	41745848	16	1	2025-08-15 14:00:00	pending	testing date format	2025-08-14 17:50:40.703135	[]	[]	60	service	120.00	0.00	pending	[]
15	41745848	3	1	2025-08-08 18:00:00	completed		2025-08-08 05:20:25.415765	[]	[]	60	service	0.00	0.00	pending	[]
16	41745848	1	1	2025-08-08 14:00:00	scheduled	aa	2025-08-08 05:22:15.08308	[]	[]	60	service	0.00	0.00	pending	[]
17	41745848	1	1	2025-08-08 12:30:00	confirmed		2025-08-08 05:30:34.267181	[]	[]	60	service	0.00	0.00	pending	[]
38	41745848	17	1	2025-08-16 15:30:00	pending	debug	2025-08-14 17:51:03.555825	[]	[]	60	service	120.00	0.00	pending	[]
18	41745848	1	1	2025-08-08 12:00:00	completed		2025-08-08 05:33:07.36975	[]	[]	60	procedure	0.00	0.00	paid	[]
39	41745848	18	1	2025-08-15 10:00:00	pending	Test booking	2025-08-15 23:04:19.27682	[]	[]	120	service	200.00	0.00	pending	[]
19	41745848	5	2	2025-08-09 00:00:00	confirmed	quero ficar bonito pro fim de semana \n	2025-08-08 17:47:38.473521	[]	[]	60	service	0.00	0.00	paid	[]
40	41745848	19	1	2025-08-15 14:00:00	pending	Test multiple services	2025-08-15 23:07:02.211389	[]	[]	120	procedure	200.00	0.00	pending	[]
41	41745848	20	1	2025-08-15 16:30:00	pending		2025-08-15 23:15:15.989593	[]	[]	120	procedure	200.00	0.00	pending	[]
42	41745848	20	1	2025-08-15 16:30:00	pending		2025-08-16 00:06:25.890648	[]	[]	120	procedure	200.00	0.00	pending	["1", "2"]
20	41745848	5	2	2025-08-08 00:00:00	completed		2025-08-08 17:54:01.69837	[]	[]	60	procedure	0.00	0.00	paid	[]
22	41745848	9	2	2025-08-09 00:00:00	cancelled	quequb	2025-08-09 19:25:08.36276	[]	[]	60	procedure	0.00	0.00	pending	[]
21	41745848	9	2	2025-08-09 00:00:00	confirmed	quero sair hoje	2025-08-09 19:22:54.588951	[]	[]	60	procedure	0.00	0.00	pending	[]
24	41745848	11	1	2025-08-09 17:00:00	confirmed		2025-08-09 16:52:09.791	[]	[]	0	service	0.00	0.00	pending	[]
25	41745848	10	1	2025-08-09 21:00:00	confirmed		2025-08-09 16:57:12.593	[]	[]	0	service	0.00	120.00	paid	[]
26	41745848	10	1	2025-08-09 18:00:00	confirmed	Agendamento de alisamento	2025-08-09 16:58:51.815	[]	[]	0	service	120.00	120.00	paid	[]
23	41745848	1	2	2025-08-09 17:00:00	confirmed		2025-08-09 16:47:36.265	[]	[]	0	service	80.00	80.00	paid	[]
44	41745848	20	1	2025-08-16 13:30:00	completed		2025-08-17 01:41:55.458004	[]	[]	180	procedure	274.95	274.95	paid	["1", "2", "3"]
27	41745848	1	1	2025-08-09 12:00:00	confirmed		2025-08-09 20:16:55.277011	[]	[]	60	procedure	120.00	120.00	paid	[]
28	41745848	10	1	2025-08-14 14:00:00	agendado	Agendamento para alisamento	2025-08-10 14:35:15.651	[]	[]	0	service	120.00	0.00	pending	[]
33	41745848	12	1	2025-08-15 10:00:00	pending	test	2025-08-14 17:42:09.636223	[]	[]	60	service	0.00	0.00	pending	[]
34	41745848	12	1	2025-08-15 10:00:00	pending		2025-08-14 17:42:43.380908	[]	[]	60	service	120.00	0.00	pending	[]
35	41745848	13	1	2025-08-15 10:00:00	pending	Test from frontend	2025-08-14 17:46:58.300524	[]	[]	60	service	120.00	0.00	pending	[]
36	41745848	15	1	2025-08-15 11:00:00	pending	test	2025-08-14 17:47:44.859555	[]	[]	60	service	120.00	0.00	pending	[]
43	41745848	20	1	2025-08-16 16:30:00	confirmed		2025-08-17 01:10:10.995013	[]	[]	120	procedure	200.00	180.00	partial	["1", "2"]
45	41745848	21	1	2025-08-19 10:30:00	pending		2025-08-18 17:02:35.111985	[]	[]	60	procedure	120.00	0.00	pending	["1"]
\.


--
-- Data for Name: business_hours; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.business_hours (id, user_id, day_of_week, is_open, open_time, close_time, break_start_time, break_end_time, created_at, updated_at) FROM stdin;
1	41745848	monday	t	09:00	17:00	12:00	13:00	2025-07-29 00:19:15.896259	2025-07-29 00:19:15.896259
2	41745848	tuesday	t	09:00	17:00	12:00	13:00	2025-07-29 00:19:16.028477	2025-07-29 00:19:16.028477
3	41745848	wednesday	t	09:00	17:00	12:00	13:00	2025-07-29 00:19:16.146999	2025-07-29 00:19:16.146999
4	41745848	thursday	t	09:00	17:00	12:00	13:00	2025-07-29 00:19:16.266003	2025-07-29 00:19:16.266003
5	41745848	friday	t	09:00	17:00	12:00	13:00	2025-07-29 00:19:16.3846	2025-07-29 00:19:16.3846
6	41745848	saturday	t	09:00	17:00	12:00	13:00	2025-07-29 00:19:16.503652	2025-07-29 00:19:16.503652
7	41745848	sunday	t	09:00	17:00	12:00	13:00	2025-07-29 00:19:16.622187	2025-07-29 00:19:16.622187
\.


--
-- Data for Name: client_packages; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.client_packages (id, user_id, client_id, package_id, purchase_date, expiry_date, sessions_used, total_sessions, status, created_at) FROM stdin;
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.clients (id, user_id, name, cpf, phone, email, birth_date, health_history, is_active, loyalty_points, created_at, updated_at, profile_image) FROM stdin;
5	41745848	robson 	35	73 0000000	Sundalia2024@gmail.com	2000-07-30	allergies a dipirona 	t	0	2025-07-30 17:24:26.39205	2025-07-30 17:52:24.478	data:image/jpeg;base64,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
4	41745848	José Alberto 	031.325	73991621520	sundalia2024@gmail.com	1980-05-23	alergia a dipirona somente 	t	0	2025-07-28 23:44:22.740385	2025-07-30 20:00:48.627	data:image/jpeg;base64,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
1	41745848	Maria Silva		+64 21 123 4567	maria@email.com	\N		t	150	2025-07-28 23:40:39.085395	2025-07-30 20:01:18.573	data:image/jpeg;base64,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
2	41745848	Ana Costa	35	+64 21 234 5678	ana@email.com	\N		t	300	2025-07-28 23:40:39.085395	2025-07-31 17:40:15.966	data:image/jpeg;base64,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
3	41745848	Carla Santos		+64 21 345 6789	carla@email.com	\N		t	75	2025-07-28 23:40:39.085395	2025-07-31 17:40:38.454	data:image/jpeg;base64,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
9	41745848	bernado 	\N	93842875872	xxxxxxxx@gmail.com	\N	\N	t	0	2025-08-09 19:22:54.516671	2025-08-09 19:22:54.516671	\N
10	41745848	Yuri Nathan Marques	03132524085	559972677627	\N	\N		t	0	2025-08-09 19:46:37.776877	2025-08-09 19:46:37.776877	\N
11	41745848	Yuri Nathan Marques	03132524085	55997267627	\N	\N		t	0	2025-08-09 19:52:12.883519	2025-08-09 19:52:12.883519	\N
12	41745848	Test User	\N	123456789	test@test.com	\N	\N	t	0	2025-08-14 17:40:39.989495	2025-08-14 17:40:39.989495	\N
13	41745848	Frontend Test User	\N	0212345678	test@frontend.com	\N	\N	t	0	2025-08-14 17:46:58.169107	2025-08-14 17:46:58.169107	\N
14	41745848		\N			\N	\N	t	0	2025-08-14 17:46:58.876587	2025-08-14 17:46:58.876587	\N
15	41745848	Valid Test	\N	0212345678	valid@test.com	\N	\N	t	0	2025-08-14 17:47:44.73638	2025-08-14 17:47:44.73638	\N
16	41745848	Date Test User	\N	0212345678	datetest@test.com	\N	\N	t	0	2025-08-14 17:50:40.564496	2025-08-14 17:50:40.564496	\N
17	41745848	Debug Date Test	\N	0212345678	debug@test.com	\N	\N	t	0	2025-08-14 17:51:03.433127	2025-08-14 17:51:03.433127	\N
18	41745848	Test User	\N	1234567890	test@example.com	\N	\N	t	0	2025-08-15 23:04:19.149094	2025-08-15 23:04:19.149094	\N
19	41745848	Test User	\N	1234567890	test2@example.com	\N	\N	t	0	2025-08-15 23:07:02.073796	2025-08-15 23:07:02.073796	\N
20	41745848	Yuri Nathan Marques	\N	55997267627	yurinatanmarques@gmail.com	\N	\N	t	0	2025-08-15 23:15:15.859136	2025-08-15 23:15:15.859136	\N
21	41745848	fernandes 	\N	4876419049651	ferndadesteste@gmail.com	\N	\N	t	0	2025-08-18 17:02:34.972903	2025-08-18 17:02:34.972903	\N
\.


--
-- Data for Name: clinical_records; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.clinical_records (id, user_id, client_id, appointment_id, procedure_date, procedure, observations, result_rating, before_images, after_images, next_appointment, created_at) FROM stdin;
1	41745848	1	\N	2025-07-30	Microneedling	\N	5	["data:image/jpeg;base64,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"]	["data:image/jpeg;base64,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7dfBV3+i2z2QYA04WjNYDQ6bDqGZntUkh5vJovI7QantW0cQZHhzcTrbfxS/Iq3RWlYTfiBdSTTYoGkEYnjT1qRrOckkzBHoX7BcqrTsxTC+gzKsqfPgq7XHkliYQzrx2+PBZcy+Whtdvu+OKmDbCRuXRIdftA+9JATHdvpszHt8c1XdkttwVuba/K2F3UsczKw4mC9t4zUzSyUYmajMjeFK1pAysfJS5NEbUylz0oOZz6wFsZpsswP2Vdc0OHTY148x2fAVWdhgs6PNjvouzAKKSfgOLXkiLXSZvkv4lb/JgdJRfrBWWzstmXtPAZhZdVADoAuPFw07lPd4I7fJDLDJELuF27nDRR889gtzjgOF1vJPI4EOkyOVtFUkcHOy3K6TfJm2lwSOmFycyVC5xcblYRXoq2ERFJAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAbtkc3fftW4mHAqFFFE2XIQJJGA3s4gHsXTkmYwnG4DPT7lxon5WJzCyZGjffsWcobmaRntR0XVkYPRa538vvUT6yVwsLNHVqqBlO4LaN5c4gotNIPUbOjSR4W887NzvRue6/rU8rxDCXX6Ryb28VXjqWR00bcy5oIsO0+9V5pnzPxvt1AaBU2uUsl9yUcF6nAZDGAMy0u8f7qGBuGeYcHW9fuVtwbcYDkBl2ZWUTMp5Xfqn+VUT5LtcGkr+YqGSfRcLEdh/sp8mm7Tdp06lVrvRhG8A+wexRwVJj6LxiZw3hW23G0V3VKmKhphqLsOG/SFjp8G63bWfnGAu+s3JR1UjZHMLCcm71Tke5rrBaKO5ZM3La8HUbVR/Xdf/c33LeYtkpngEEAXBB4fBXHEp3gKRswzs4tvko6flE9S8My9wa26jMvALEjw6wByUa1SMmzJJJuTdYRFJAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAWWktNwsIgJeeNtFtG/Fe+oUCy1xa64UUTZ2qd/OQtzF2jCfYpAL3A3gA+J9hC50E3NvDxm06jiFenmbFCHNN3O9A+1c8otPB0RkqyVKx4fUOto3o+/zuqckhDrA5BSPdhbdVltFUYyZJzxtoFoSSbnVYRXopYREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAbxvw5HRTGQYRd1wFWRQ0TZs9xcblaoikgIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgP/9k="]	2025-07-31	2025-07-29 18:53:46.747331
2	41745848	5	\N	2025-07-29	Chemical Peel	\N	4	[]	[]	2025-08-01	2025-07-30 17:25:30.071875
3	41745848	2	\N	2025-08-07	Microneedling	\N	5	[]	[]	2025-08-14	2025-08-07 16:48:05.247271
\.


--
-- Data for Name: feedback; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.feedback (id, user_id, client_id, appointment_id, rating, comment, created_at) FROM stdin;
\.


--
-- Data for Name: inventory; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.inventory (id, user_id, item_name, category, current_stock, min_stock, unit, last_restocked, created_at) FROM stdin;
1	41745848	alcool 	products	11	5	units	2025-07-29	2025-07-29 19:29:13.078773
2	41745848	glooves	ppe	47	10	units	2025-07-12	2025-08-07 16:45:49.419222
\.


--
-- Data for Name: loyalty_packages; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.loyalty_packages (id, user_id, name, description, services, original_price, discounted_price, discount_percentage, validity_days, is_active, created_at) FROM stdin;
1	41745848	Gabriel  	\N	"[{\\"serviceId\\":1,\\"quantity\\":1}]"	120.00	\N	\N	90	t	2025-07-31 18:01:25.072377
\.


--
-- Data for Name: marketing_campaigns; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.marketing_campaigns (id, user_id, name, type, subject, content, target_audience, status, scheduled_for, sent_at, open_rate, click_rate, created_at) FROM stdin;
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.messages (id, user_id, client_id, type, channel, content, is_scheduled, scheduled_for, sent_at, status, created_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notifications (id, user_id, client_id, appointment_id, type, title, message, channel, status, scheduled_for, sent_at, created_at) FROM stdin;
1	41745848	5	19	booking_request	New Booking Request	Gabriel   has requested an appointment on 2025-08-09 at 10:30	in_app	pending	\N	\N	2025-08-08 17:47:38.551622
2	41745848	5	20	booking_request	New Booking Request	Gabriel   has requested an appointment on 2025-08-08 at 12:30	in_app	pending	\N	\N	2025-08-08 17:54:01.771544
3	41745848	9	21	booking_request	New Booking Request	bernado  has requested an appointment on 2025-08-09 at 09:30	in_app	pending	\N	\N	2025-08-09 19:22:54.653051
4	41745848	9	22	booking_request	New Booking Request	bernado  has requested an appointment on 2025-08-09 at 09:30	in_app	pending	\N	\N	2025-08-09 19:25:08.426496
5	41745848	19	40	booking_request	New Booking Request	Test User has requested an appointment for: Alisamento definitivo, Escova on 2025-08-15 at 14:00	in_app	pending	\N	\N	2025-08-15 23:07:02.281674
6	41745848	20	41	booking_request	New Booking Request	Yuri Nathan Marques has requested an appointment for: Alisamento definitivo, Escova on 2025-08-15 at 16:30	in_app	pending	\N	\N	2025-08-15 23:15:16.053915
7	41745848	20	42	booking_request	New Booking Request	Yuri Nathan Marques has requested an appointment for: Alisamento definitivo, Escova on 2025-08-15 at 16:30	in_app	pending	\N	\N	2025-08-16 00:06:25.966877
8	41745848	20	43	booking_request	New Booking Request	Yuri Nathan Marques has requested an appointment for: Alisamento definitivo, Escova on 2025-08-16 at 16:30	in_app	pending	\N	\N	2025-08-17 01:10:11.066184
9	41745848	20	44	booking_request	New Booking Request	Yuri Nathan Marques has requested an appointment for: Alisamento definitivo, Escova, corte  on 2025-08-16 at 13:30	in_app	pending	\N	\N	2025-08-17 01:41:55.531389
10	41745848	21	45	booking_request	New Booking Request	fernandes  has requested an appointment for: Alisamento definitivo on 2025-08-19 at 10:30	in_app	pending	\N	\N	2025-08-18 17:02:35.18341
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.payments (id, user_id, appointment_id, client_id, amount, currency, method, status, transaction_id, processed_at, created_at) FROM stdin;
\.


--
-- Data for Name: procedures; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.procedures (id, user_id, name, description, category, duration, materials, is_active, created_at, price) FROM stdin;
1	41745848	Alisamento definitivo	Alisamento definitivo não indicado para mulheres em período de gestação	Hair Treatment	60	[{"quantity": 1, "materialId": 1}, {"quantity": 1, "materialId": 2}]	t	2025-08-08 05:04:48.034412	120.00
2	41745848	Escova	Escova para eventos	Hair Treatment	60	[{"quantity": 1, "materialId": 2}]	t	2025-08-08 06:00:06.158544	80.00
3	41745848	corte 	Women's Style Cut	Hair Treatment	60	[]	t	2025-08-13 19:34:17.564582	74.95
4	41745848	Hair Colour Dye	Professional hair coloring service	Hair Colour Dye	120	[]	t	2025-08-13 19:45:19.089732	150.00
5	41745848	Hair Colour Dye RED and COPPER	Specialized red and copper hair coloring	Hair Colour Dye	150	[]	t	2025-08-13 19:45:19.089732	180.00
6	41745848	Foils Packages / Balayage and Highlights	Premium highlighting and balayage service	Foils Packages / Balayage and Highlights	180	[]	t	2025-08-13 19:45:19.089732	220.00
7	41745848	Hair Botox - Smoothing Treatment	Hair botox treatment for smooth hair	Hair Botox - Smoothing Treatment	90	[]	t	2025-08-13 19:45:19.089732	120.00
8	41745848	Brazilian Keratin (Progressive)	Brazilian keratin smoothing treatment	Brazilian Keratin (Progressive)	120	[]	t	2025-08-13 19:45:19.089732	200.00
9	41745848	Hair Treatments	Deep conditioning hair treatments	Hair Treatments	45	[]	t	2025-08-13 19:45:19.089732	80.00
10	41745848	Blow Dry (Escova)	Professional blow dry styling	Blow Dry (Escova)	30	[]	t	2025-08-13 19:45:19.089732	45.00
11	41745848	Hair Extension	Hair extension application service	Hair Extension	180	[]	t	2025-08-13 19:45:19.089732	300.00
12	41745848	Nail	Professional nail services	Nail	60	[]	t	2025-08-13 19:45:19.089732	50.00
13	41745848	Consultation	Hair and beauty consultation	Consultation	30	[]	t	2025-08-13 19:45:19.089732	0.00
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.services (id, user_id, name, description, duration, price, is_active, created_at, category) FROM stdin;
1	41745848	Facial Treatment	Deep cleansing facial with hydration	60	120.00	t	2025-07-28 23:40:41.642787	General
2	41745848	Chemical Peel	Light chemical peel for skin renewal	45	180.00	t	2025-07-28 23:40:41.642787	General
3	41745848	Microdermabrasion	Professional microdermabrasion treatment	90	200.00	t	2025-07-28 23:40:41.642787	General
4	41745848	Anti-aging Treatment	Comprehensive anti-aging facial therapy	75	250.00	t	2025-07-28 23:40:41.642787	General
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sessions (sid, sess, expire) FROM stdin;
uQJEcZpv8Hf0U3cTyVk_nnjlfzXc4KDp	{"cookie": {"path": "/", "secure": true, "expires": "2025-08-25T23:54:54.522Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "2f8f7276-73a0-443d-8e07-04c40363d9de", "exp": 1755564894, "iat": 1755561294, "iss": "https://replit.com/oidc", "sub": "41745848", "email": "yurinatanmarques@gmail.com", "at_hash": "imFzbXsuhLVPbhGUUCGPTA", "username": "yurinatanmarque", "auth_time": 1755051901, "last_name": "Marques", "first_name": "Yuri"}, "expires_at": 1755564894, "access_token": "4T_UV68FHu6NHIto8J1OKyQl530il0lLVW4YMIGZpyO", "refresh_token": "mDHXtHpc8QPG-lvlKB2iLy6H8yHahbTSdp17aDb2Pvg"}}}	2025-08-25 23:54:56
AS45nAO851H6byFasgfzlljsXkPySaXD	{"cookie": {"path": "/", "secure": true, "expires": "2025-08-29T00:22:13.880Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "2f8f7276-73a0-443d-8e07-04c40363d9de", "exp": 1755825733, "iat": 1755822133, "iss": "https://replit.com/oidc", "sub": "41745848", "email": "yurinatanmarques@gmail.com", "at_hash": "n6xNGnAc4LVJaXzVL9Qwpw", "username": "yurinatanmarque", "auth_time": 1755647820, "last_name": "Marques", "first_name": "Yuri"}, "expires_at": 1755825733, "access_token": "LXoR8VTlUws9rAaXBx5zGD5_0ceeRSTA2of3uG5jSvX", "refresh_token": "UnVOgG69vNimNshcr0wra7zqTRVny_LF8-FEeu_XTwG"}}}	2025-08-29 00:22:15
2OOaks-22vKaE-NhjYdQuk_2r-JarB6i	{"cookie": {"path": "/", "secure": true, "expires": "2025-08-25T17:01:14.344Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "2f8f7276-73a0-443d-8e07-04c40363d9de", "exp": 1755540074, "iat": 1755536474, "iss": "https://replit.com/oidc", "sub": "41745848", "email": "yurinatanmarques@gmail.com", "at_hash": "0QZ3-q-70sdL99FOY0k8dw", "username": "yurinatanmarque", "auth_time": 1755291420, "last_name": "Marques", "first_name": "Yuri"}, "expires_at": 1755540074, "access_token": "V2NN4nn7fB3tg6RuhbPd6qEjmTviD30kmhzrrapIT2U", "refresh_token": "o-6JyJZIJJzFycSZLBcZvQWbejQzbEcSk8dP6v6_lok"}}}	2025-08-25 17:59:13
\.


--
-- Data for Name: social_media_posts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.social_media_posts (id, user_id, platform, content, image_url, post_type, status, scheduled_for, published_at, engagement, created_at) FROM stdin;
\.


--
-- Data for Name: staff; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.staff (id, user_id, name, email, phone, role, specialties, commission_rate, is_active, start_date, created_at, updated_at) FROM stdin;
1	41745848	yuri	dimoreia2@gmail.com	73991621520	manager	[]	12.00	t	2025-07-29	2025-07-29 00:02:25.261054	2025-07-29 00:02:25.261054
2	41745848	Geraldo mangela 	Sundalia2024@gmail.com	73 0000000	manager	[]	10.00	t	2025-07-29	2025-07-29 18:50:58.09245	2025-07-29 18:50:58.09245
3	41745848	Gabriel  	gabriestafffff@gmail	00000000	therapist	[]	10.00	t	2025-07-31	2025-07-31 17:53:19.555536	2025-07-31 17:53:19.555536
5	41745848	Maria Silva	maria@salon.com	+64-21-123-4567	Stylist	["Hair Colour", "Highlights", "Balayage"]	0.00	t	2025-08-13	2025-08-13 19:47:10.385749	2025-08-13 19:47:10.385749
6	41745848	Ana Costa	ana@salon.com	+64-21-123-4568	Specialist	["Hair Treatment", "Brazilian Keratin", "Hair Botox"]	0.00	t	2025-08-13	2025-08-13 19:47:10.385749	2025-08-13 19:47:10.385749
7	41745848	Jessica Brown	jessica@salon.com	+64-21-123-4569	Technician	["Nail Services", "Hair Extension"]	0.00	t	2025-08-13	2025-08-13 19:47:10.385749	2025-08-13 19:47:10.385749
\.


--
-- Data for Name: staff_schedules; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.staff_schedules (id, staff_id, day_of_week, start_time, end_time, is_available, created_at) FROM stdin;
1	1	tuesday	06:10	06:30	t	2025-07-29 00:10:33.48651
2	2	wednesday	00:00	15:55	t	2025-07-29 18:52:05.78171
3	3	saturday	08:00	14:30	t	2025-07-31 17:54:04.41019
4	3	friday	18:00	00:00	t	2025-07-31 17:54:34.205604
\.


--
-- Data for Name: sustainability_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sustainability_logs (id, user_id, item_id, action, quantity, waste_prevented, notes, date, created_at) FROM stdin;
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.transactions (id, user_id, client_id, appointment_id, type, description, amount, transaction_date, category, is_paid, due_date, created_at) FROM stdin;
1	41745848	\N	\N	income	Tratamento de Ponte	800.00	1990-12-09	consultation	t	\N	2025-07-29 00:01:02.137694
2	41745848	\N	\N	expense	Tratamento de Ponte	800.00	1990-12-09	marketing	t	\N	2025-07-29 00:01:24.598982
3	41745848	\N	\N	income	ponte 	1200.00	1990-08-09	other	t	\N	2025-07-29 00:08:18.958288
4	41745848	\N	\N	income	jose	1000.00	2025-07-29	product	t	\N	2025-07-29 18:05:42.837289
5	41745848	1	18	income	Payment for Alisamento definitivo - Maria Silva	0.00	2025-08-08	Service Payment	t	\N	2025-08-08 05:40:11.284563
6	41745848	5	19	income	Payment for Chemical Peel - robson 	0.00	2025-08-08	Service Payment	t	\N	2025-08-08 17:48:32.488879
7	41745848	5	20	income	Payment for Escova - robson 	0.00	2025-08-08	Service Payment	t	\N	2025-08-08 17:54:59.875433
8	41745848	10	25	income	Payment for Facial Treatment - Yuri Nathan Marques	0.00	2025-08-09	Service Payment	t	\N	2025-08-09 20:06:42.087342
9	41745848	10	25	income	Payment for Facial Treatment - Yuri Nathan Marques	120.00	2025-08-09	Service Payment	t	\N	2025-08-09 20:09:22.760826
10	41745848	10	26	income	Payment for Facial Treatment - Yuri Nathan Marques	120.00	2025-08-09	Service Payment	t	\N	2025-08-09 20:09:49.361399
11	41745848	10	26	income	Payment for Facial Treatment - Yuri Nathan Marques	0.00	2025-08-09	Service Payment	t	\N	2025-08-09 20:09:56.388175
12	41745848	1	23	income	Payment for Chemical Peel - Maria Silva	80.00	2025-08-09	Service Payment	t	\N	2025-08-09 20:12:32.935558
13	41745848	1	27	income	Payment for Alisamento definitivo - Maria Silva	120.00	2025-08-09	Service Payment	t	\N	2025-08-09 20:17:21.784335
14	41745848	\N	\N	expense	Compra de material	120.00	2025-08-15	materials	t	\N	2025-08-17 01:58:17.22346
15	41745848	20	44	income	Payment for Alisamento definitivo - Yuri Nathan Marques	274.95	2025-08-17	Service Payment	t	\N	2025-08-17 01:59:16.459031
16	41745848	20	43	income	Payment for Alisamento definitivo - Yuri Nathan Marques	180.00	2025-08-17	Service Payment	t	\N	2025-08-17 02:00:25.953657
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, email, first_name, last_name, profile_image_url, professional_registration, specialties, clinic_name, clinic_cnpj, clinic_address, clinic_phone, clinic_whatsapp, created_at, updated_at, public_link, hero_image_url) FROM stdin;
41745848	yurinatanmarques@gmail.com	Yuri	Marques	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-22 22:39:02.908934	2025-08-19 23:57:01.073	o4c4g8gxmebu92v7	/objects/uploads/0f550a56-f2a8-44fa-8f58-a2aa0bdab6f6
\.


--
-- Name: appointments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.appointments_id_seq', 45, true);


--
-- Name: business_hours_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.business_hours_id_seq', 7, true);


--
-- Name: client_packages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.client_packages_id_seq', 1, false);


--
-- Name: clients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.clients_id_seq', 21, true);


--
-- Name: clinical_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.clinical_records_id_seq', 3, true);


--
-- Name: feedback_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.feedback_id_seq', 1, false);


--
-- Name: inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.inventory_id_seq', 2, true);


--
-- Name: loyalty_packages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.loyalty_packages_id_seq', 1, true);


--
-- Name: marketing_campaigns_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.marketing_campaigns_id_seq', 1, false);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.messages_id_seq', 1, false);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.notifications_id_seq', 10, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.payments_id_seq', 1, false);


--
-- Name: procedures_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.procedures_id_seq', 13, true);


--
-- Name: services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.services_id_seq', 4, true);


--
-- Name: social_media_posts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.social_media_posts_id_seq', 1, false);


--
-- Name: staff_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.staff_id_seq', 7, true);


--
-- Name: staff_schedules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.staff_schedules_id_seq', 4, true);


--
-- Name: sustainability_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sustainability_logs_id_seq', 1, false);


--
-- Name: transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.transactions_id_seq', 16, true);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: business_hours business_hours_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.business_hours
    ADD CONSTRAINT business_hours_pkey PRIMARY KEY (id);


--
-- Name: client_packages client_packages_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.client_packages
    ADD CONSTRAINT client_packages_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: clinical_records clinical_records_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clinical_records
    ADD CONSTRAINT clinical_records_pkey PRIMARY KEY (id);


--
-- Name: feedback feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_pkey PRIMARY KEY (id);


--
-- Name: inventory inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (id);


--
-- Name: loyalty_packages loyalty_packages_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.loyalty_packages
    ADD CONSTRAINT loyalty_packages_pkey PRIMARY KEY (id);


--
-- Name: marketing_campaigns marketing_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.marketing_campaigns
    ADD CONSTRAINT marketing_campaigns_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: procedures procedures_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.procedures
    ADD CONSTRAINT procedures_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: social_media_posts social_media_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.social_media_posts
    ADD CONSTRAINT social_media_posts_pkey PRIMARY KEY (id);


--
-- Name: staff staff_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_pkey PRIMARY KEY (id);


--
-- Name: staff_schedules staff_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.staff_schedules
    ADD CONSTRAINT staff_schedules_pkey PRIMARY KEY (id);


--
-- Name: sustainability_logs sustainability_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sustainability_logs
    ADD CONSTRAINT sustainability_logs_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_public_link_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_public_link_key UNIQUE (public_link);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: appointments appointments_client_id_clients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_client_id_clients_id_fk FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: appointments appointments_service_id_services_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_service_id_services_id_fk FOREIGN KEY (service_id) REFERENCES public.services(id);


--
-- Name: appointments appointments_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: business_hours business_hours_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.business_hours
    ADD CONSTRAINT business_hours_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: client_packages client_packages_client_id_clients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.client_packages
    ADD CONSTRAINT client_packages_client_id_clients_id_fk FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: client_packages client_packages_package_id_loyalty_packages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.client_packages
    ADD CONSTRAINT client_packages_package_id_loyalty_packages_id_fk FOREIGN KEY (package_id) REFERENCES public.loyalty_packages(id);


--
-- Name: client_packages client_packages_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.client_packages
    ADD CONSTRAINT client_packages_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: clients clients_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: clinical_records clinical_records_appointment_id_appointments_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clinical_records
    ADD CONSTRAINT clinical_records_appointment_id_appointments_id_fk FOREIGN KEY (appointment_id) REFERENCES public.appointments(id);


--
-- Name: clinical_records clinical_records_client_id_clients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clinical_records
    ADD CONSTRAINT clinical_records_client_id_clients_id_fk FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: clinical_records clinical_records_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clinical_records
    ADD CONSTRAINT clinical_records_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: feedback feedback_appointment_id_appointments_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_appointment_id_appointments_id_fk FOREIGN KEY (appointment_id) REFERENCES public.appointments(id);


--
-- Name: feedback feedback_client_id_clients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_client_id_clients_id_fk FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: feedback feedback_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: inventory inventory_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: loyalty_packages loyalty_packages_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.loyalty_packages
    ADD CONSTRAINT loyalty_packages_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: marketing_campaigns marketing_campaigns_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.marketing_campaigns
    ADD CONSTRAINT marketing_campaigns_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: messages messages_client_id_clients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_client_id_clients_id_fk FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: messages messages_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: notifications notifications_appointment_id_appointments_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_appointment_id_appointments_id_fk FOREIGN KEY (appointment_id) REFERENCES public.appointments(id);


--
-- Name: notifications notifications_client_id_clients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_client_id_clients_id_fk FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: notifications notifications_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: payments payments_appointment_id_appointments_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_appointment_id_appointments_id_fk FOREIGN KEY (appointment_id) REFERENCES public.appointments(id);


--
-- Name: payments payments_client_id_clients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_client_id_clients_id_fk FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: payments payments_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: services services_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: social_media_posts social_media_posts_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.social_media_posts
    ADD CONSTRAINT social_media_posts_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: staff_schedules staff_schedules_staff_id_staff_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.staff_schedules
    ADD CONSTRAINT staff_schedules_staff_id_staff_id_fk FOREIGN KEY (staff_id) REFERENCES public.staff(id);


--
-- Name: staff staff_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: sustainability_logs sustainability_logs_item_id_inventory_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sustainability_logs
    ADD CONSTRAINT sustainability_logs_item_id_inventory_id_fk FOREIGN KEY (item_id) REFERENCES public.inventory(id);


--
-- Name: sustainability_logs sustainability_logs_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sustainability_logs
    ADD CONSTRAINT sustainability_logs_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: transactions transactions_appointment_id_appointments_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_appointment_id_appointments_id_fk FOREIGN KEY (appointment_id) REFERENCES public.appointments(id);


--
-- Name: transactions transactions_client_id_clients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_client_id_clients_id_fk FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: transactions transactions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

